import { VersionedTransaction, PublicKey, AddressLookupTableAccount } from '@solana/web3.js';
import bs58 from 'bs58';
import { ApiError, requireThat, request, parseRpc, integer, formatAmount, hash, now } from './util.js';
import { validSignature, validAddress } from './auth.js';

export const SYSTEM = '11111111111111111111111111111111';
export const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const COMPUTE = 'ComputeBudget111111111111111111111111111111';
export const ATA = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const JUPITER = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
export const WSOL = 'So11111111111111111111111111111111111111112';
const known = new Set([SYSTEM, TOKEN, COMPUTE, ATA]);
export class Rpc {
  constructor(config, fetchImpl = fetch) { this.config = config; this.fetchImpl = fetchImpl; }
  async call(cluster, method, params, signal) {
    requireThat(Object.hasOwn(this.config.rpc, cluster), 400, 'INVALID_CLUSTER', 'Choose mainnet-beta or devnet.');
    requireThat(['getTransaction','getSignaturesForAddress','getMultipleAccounts','getAccountInfo','getTokenAccountsByOwner','simulateTransaction','isBlockhashValid','getFeeForMessage'].includes(method), 400, 'RPC_METHOD_FORBIDDEN', 'Only supported read-only RPC methods are permitted.');
    const data = await request(this.config.rpc[cluster], { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}), signal }, { parse:parseRpc,fetchImpl:this.fetchImpl });
    if (data.error) throw new ApiError(502,'RPC_ERROR',`Solana RPC rejected ${method} (code ${data.error.code}).`);
    requireThat(Object.hasOwn(data,'result'),502,'RPC_RESPONSE_INVALID','RPC response has no result.');
    return data.result;
  }
}
const u64 = (data, offset) => data.readBigUInt64LE(offset).toString();
const key = (data, offset) => bs58.encode(data.subarray(offset, offset + 32));

export function decodeInstruction(programId, accounts, raw, index, inner = false) {
  const base = { index, inner, programId, accounts, supported:false, type:'unknown', decoded:{} };
  try {
    const data = typeof raw === 'string' ? Buffer.from(bs58.decode(raw)) : Buffer.from(raw);
    base.dataBase58 = bs58.encode(data);
    if (programId === SYSTEM) {
      const opcode = data.readUInt32LE(0);
      if (opcode === 2 && data.length === 12 && accounts.length >= 2) return { ...base,supported:true,type:'sol_transfer',decoded:{source:accounts[0],destination:accounts[1],amount:u64(data,4),decimals:9} };
      if (opcode === 0 && data.length === 52 && accounts.length >= 2) return { ...base,supported:true,type:'create_account',decoded:{source:accounts[0],account:accounts[1],lamports:u64(data,4),space:u64(data,12),owner:key(data,20)} };
      if (opcode === 4) return { ...base,type:'durable_nonce',decoded:{} };
    }
    if (programId === TOKEN) {
      const opcode=data[0];
      if ([3,4,12,13].includes(opcode)) {
        const checked=opcode===12||opcode===13; const approval=opcode===4||opcode===13;
        if (data.length !== (checked ? 10 : 9) || accounts.length < (checked ? 4 : 3)) return base;
        return { ...base,supported:true,type:approval?'token_approve':'token_transfer',decoded:{source:accounts[0],...(checked?{mint:accounts[1],decimals:data[9]}:{}),[approval?'delegate':'destination']:accounts[checked?2:1],authority:accounts[checked?3:2],amount:u64(data,1)} };
      }
      if (opcode===5 && data.length===1 && accounts.length>=2) return {...base,supported:true,type:'token_revoke',decoded:{account:accounts[0],authority:accounts[1]}};
      if (opcode===6 && data.length>=3 && accounts.length>=2) {
        const option=data[2]; if (![0,1].includes(option) || data.length !== (option?35:3)) return base;
        return {...base,supported:true,type:'authority_change',decoded:{account:accounts[0],authorityType:data[1],currentAuthority:accounts[1],newAuthority:option?key(data,3):null}};
      }
      if (opcode===9 && data.length===1 && accounts.length>=3) return {...base,supported:true,type:'close_account',decoded:{account:accounts[0],destination:accounts[1],authority:accounts[2]}};
      if (opcode===17 && data.length===1) return {...base,supported:true,type:'sync_native',decoded:{account:accounts[0]}};
    }
    if (programId===COMPUTE && data.length) {
      if (data[0]===2 && data.length===5) return {...base,supported:true,type:'compute_limit',decoded:{units:data.readUInt32LE(1)}};
      if (data[0]===3 && data.length===9) return {...base,supported:true,type:'priority_fee_rate',decoded:{microLamportsPerUnit:u64(data,1)}};
    }
    if (programId===ATA && (data.length===0||data.length===1&&[0,1].includes(data[0])) && accounts.length>=6) return {...base,supported:true,type:'associated_account_create',decoded:{payer:accounts[0],account:accounts[1],owner:accounts[2],mint:accounts[3]}};
  } catch { return {...base,decodeError:'Malformed or unsupported instruction data.'}; }
  return base;
}

function decodeList(message, meta, accountKeys) {
  const output=[];
  const add=(ix,index,inner)=>{
    const programId=accountKeys[ix.programIdIndex]; const accounts=(ix.accounts || ix.accountKeyIndexes || []).map(i=>accountKeys[i]);
    requireThat(programId&&accounts.every(Boolean),502,'ACCOUNT_INDEX_INVALID','Transaction contains unresolved account indexes.');
    output.push(decodeInstruction(programId,accounts,ix.data,index,inner));
  };
  message.instructions.forEach((ix,i)=>{add(ix,String(i),false); const group=meta?.innerInstructions?.find(g=>g.index===i); group?.instructions.forEach((item,j)=>add(item,`${i}.${j}`,true));});
  return output;
}
export function normalizeTransaction(result, signature, cluster) {
  requireThat(result?.meta && result?.transaction?.message,422,'MISSING_METADATA','This transaction has no usable metadata.');
  const {meta,transaction}=result;
  const keys=[...transaction.message.accountKeys.map(k=>typeof k==='string'?k:k.pubkey),...(meta.loadedAddresses?.writable||[]),...(meta.loadedAddresses?.readonly||[])];
  const instructions=decodeList(transaction.message,meta,keys);
  const assetChanges=[];
  for (let i=0;i<keys.length;i++) {
    if (meta.preBalances?.[i]===undefined||meta.postBalances?.[i]===undefined) continue;
    const delta=integer(meta.postBalances[i])-integer(meta.preBalances[i]);
    if(delta!==0n) assetChanges.push({account:keys[i],owner:keys[i],mint:null,symbol:'SOL',rawAmount:delta.toString(),decimals:9,amount:formatAmount(delta,9)});
  }
  const pre=new Map((meta.preTokenBalances||[]).map(b=>[`${b.accountIndex}:${b.mint}`,b]));
  const post=new Map((meta.postTokenBalances||[]).map(b=>[`${b.accountIndex}:${b.mint}`,b]));
  for(const tokenKey of new Set([...pre.keys(),...post.keys()])) {
    const before=pre.get(tokenKey),after=post.get(tokenKey), b=after||before;
    const delta=integer(after?.uiTokenAmount.amount||'0')-integer(before?.uiTokenAmount.amount||'0');
    if(delta!==0n) assetChanges.push({account:keys[b.accountIndex],owner:b.owner||null,mint:b.mint,rawAmount:delta.toString(),decimals:b.uiTokenAmount.decimals,amount:formatAmount(delta,b.uiTokenAmount.decimals)});
  }
  for (const ix of instructions) if(ix.decoded.source && ix.type.startsWith('token_')) {
    const b=[...(meta.preTokenBalances||[]),...(meta.postTokenBalances||[])].find(t=>keys[t.accountIndex]===ix.decoded.source);
    if(b) { ix.decoded.mint ||= b.mint; ix.decoded.decimals ??= b.uiTokenAmount.decimals; }
  }
  return {schemaVersion:1,parserVersion:'1.0.0',signature,cluster,slot:result.slot,blockTime:result.blockTime,feePayer:keys[0],feeLamports:integer(meta.fee).toString(),status:meta.err?'failed':'success',error:meta.err||null,logs:meta.logMessages||[],instructions,assetChanges,programs:[...new Set(instructions.map(i=>i.programId))],coverage:{supported:instructions.filter(i=>i.supported).length,total:instructions.length,unsupported:instructions.filter(i=>!i.supported).map(i=>i.index)},retrievedAt:now()};
}

export async function explainSignature(rpc, cluster, signature, signal) {
  requireThat(validSignature(signature),400,'INVALID_SIGNATURE','Provide a 64-byte base58 transaction signature.');
  const result=await rpc.call(cluster,'getTransaction',[signature,{encoding:'json',commitment:'confirmed',maxSupportedTransactionVersion:0}],signal);
  requireThat(result,404,'TRANSACTION_NOT_FOUND','Transaction not found at confirmed commitment on this provider and cluster.');
  return normalizeTransaction(result,signature,cluster);
}

export async function reviewPayload(rpc, cluster, payload, intent = {}, signal) {
  requireThat(typeof payload==='string'&&payload.length<=1700,400,'INVALID_PAYLOAD','Supply a base64 serialized unsigned transaction.');
  const buffer=Buffer.from(payload,'base64');
  requireThat(buffer.length>0&&buffer.length<=1232&&buffer.toString('base64')===payload,400,'INVALID_PAYLOAD','Payload must be canonical base64 within the Solana wire-size limit.');
  let tx; try {tx=VersionedTransaction.deserialize(buffer);} catch {throw new ApiError(400,'INVALID_TRANSACTION','Transaction could not be deserialized.');}
  requireThat(tx.version==='legacy'||tx.version===0,400,'UNSUPPORTED_VERSION','Only legacy and v0 transactions are supported.');
  requireThat(tx.signatures.every(s=>s.every(byte=>byte===0)),400,'SIGNED_PAYLOAD_REJECTED','Supply an unsigned transaction, not one with existing signatures.');
  requireThat(tx.message.header.numRequiredSignatures>0&&tx.signatures.length===tx.message.header.numRequiredSignatures,400,'INVALID_SIGNERS','Invalid transaction signature slots.');
  const lookupTables=[];
  for(const lookup of tx.message.addressTableLookups||[]) {
    const response=await rpc.call(cluster,'getAccountInfo',[lookup.accountKey.toBase58(),{encoding:'base64',commitment:'confirmed'}],signal);
    requireThat(response.value?.owner==='AddressLookupTab1e1111111111111111111111111',422,'LOOKUP_UNRESOLVED','Address lookup table could not be verified.');
    try {lookupTables.push(new AddressLookupTableAccount({key:lookup.accountKey,state:AddressLookupTableAccount.deserialize(Buffer.from(response.value.data[0],'base64'))}));} catch {throw new ApiError(422,'LOOKUP_UNRESOLVED','Address lookup table is invalid.');}
  }
  let resolved;try{resolved=tx.message.getAccountKeys(tx.version===0?{addressLookupTableAccounts:lookupTables}:undefined);}catch{throw new ApiError(422,'LOOKUP_UNRESOLVED','Cannot resolve transaction accounts.');}
  const keys=Array.from({length:resolved.length},(_,i)=>resolved.get(i).toBase58());
  const message={instructions:tx.message.compiledInstructions.map(ix=>({programIdIndex:ix.programIdIndex,accounts:Array.from(ix.accountKeyIndexes),data:bs58.encode(ix.data)}))};
  const instructions=decodeList(message,null,keys);
  requireThat(!instructions.some(i=>i.type==='durable_nonce'),422,'DURABLE_NONCE_UNSUPPORTED','Durable nonce review is not supported by this adapter.');
  const digest=hash(tx.message.serialize());
  const facts={schemaVersion:1,parserVersion:'1.0.0',cluster,payloadDigest:digest,status:'proposed',feePayer:keys[0],requiredSigners:keys.slice(0,tx.message.header.numRequiredSignatures),instructions,assetChanges:[],programs:[...new Set(instructions.map(i=>i.programId))],coverage:{supported:instructions.filter(i=>i.supported).length,total:instructions.length,unsupported:instructions.filter(i=>!i.supported).map(i=>i.index)},retrievedAt:now()};
  let simulation;
  try {
    const valid=await rpc.call(cluster,'isBlockhashValid',[tx.message.recentBlockhash,{commitment:'confirmed'}],signal);
    const addresses=keys.filter((_,i)=>tx.message.isAccountWritable(i)).slice(0,20);
    const before=addresses.length?await rpc.call(cluster,'getMultipleAccounts',[addresses,{encoding:'jsonParsed',commitment:'confirmed'}],signal):null;
    const settings={encoding:'base64',commitment:'confirmed',sigVerify:false,replaceRecentBlockhash:!valid.value,innerInstructions:true,accounts:{encoding:'jsonParsed',addresses}};
    const result=await rpc.call(cluster,'simulateTransaction',[payload,settings],signal);
    simulation={status:result.value.err?'failed':'success',slot:result.context.slot,preStateSlot:before?.context.slot,originalBlockhash:tx.message.recentBlockhash,blockhashReplaced:!valid.value,settings,error:result.value.err,logs:result.value.logs||[],unitsConsumed:result.value.unitsConsumed,observations:[],limitations:['Simulation is not a safety guarantee. Pre-state and simulated post-state may come from different slots.','Only selected writable accounts are inspected. Future state and execution can differ.']};
    addresses.forEach((address,i)=>{ const a=before?.value?.[i],b=result.value.accounts?.[i]; if(b===undefined) return;
      const observation={account:address,preLamports:a?integer(a.lamports).toString():'0',postLamports:b?integer(b.lamports).toString():'0',lamportDelta:(integer(b?.lamports||0)-integer(a?.lamports||0)).toString()};
      const preToken=a?.data?.parsed?.info,postToken=b?.data?.parsed?.info;
      if(preToken?.tokenAmount&&postToken?.tokenAmount&&preToken.mint===postToken.mint) observation.token={mint:preToken.mint,owner:preToken.owner,decimals:preToken.tokenAmount.decimals,rawDelta:(integer(postToken.tokenAmount.amount)-integer(preToken.tokenAmount.amount)).toString()};
      simulation.observations.push(observation);
    });
  }catch(error){simulation={status:'unavailable',error:{code:error.code||'SIMULATION_UNAVAILABLE'},limitations:['The simulation could not be completed; no successful outcome is implied.']};}
  return {facts,simulation,intent};
}

export function findings(facts, simulation, intent = {}) {
  const result=[];const add=(code,severity,title,explanation,index=null)=>result.push({code,severity,title,explanation,instructionIndex:index,confidence:'high',evidenceIds:[],limitations:[]});
  for(const ix of facts.instructions){
    if(!ix.supported) add(known.has(ix.programId)?'UNSUPPORTED_INSTRUCTION':'UNKNOWN_PROGRAM','info','Instruction coverage incomplete',`Instruction ${ix.index} in ${ix.programId} is not decoded by this adapter. Unknown does not mean malicious.`,ix.index);
    if(ix.type==='token_approve') add('DELEGATE_APPROVAL','medium','Token spending permission requested',`Delegate ${ix.decoded.delegate} may spend ${ix.decoded.amount} raw units from ${ix.decoded.source}. Confirm this matches your intent.`,ix.index);
    if(ix.type==='authority_change') add('AUTHORITY_CHANGE','medium','Token authority change',`Authority type ${ix.decoded.authorityType} on ${ix.decoded.account} changes to ${ix.decoded.newAuthority||'none'}. Review the scope.`,ix.index);
    if(ix.type==='close_account') add('ACCOUNT_CLOSE','low','Token account closure',`Account ${ix.decoded.account} is closed and remaining lamports go to ${ix.decoded.destination}. This can be normal cleanup.`,ix.index);
  }
  if(simulation?.status==='failed') add('SIMULATION_FAILED','medium','Simulation failed','The submitted transaction did not simulate successfully. Inspect the error and logs; failure alone does not imply a scam.');
  if(simulation?.status==='unavailable') add('SIMULATION_UNAVAILABLE','info','Simulation unavailable','Execution could not be previewed. Do not infer safety from missing results.');
  if(simulation?.blockhashReplaced) add('BLOCKHASH_STALE','info','Blockhash replaced for simulation','The original blockhash was not valid. Simulation used a replacement; this is not the original execution context.');
  if(intent.maxSolLamports && validAddress(intent.owner)) {
    const direct=facts.instructions.filter(i=>i.type==='sol_transfer'&&i.decoded.source===intent.owner).reduce((sum,i)=>sum+integer(i.decoded.amount),0n);
    if(direct>integer(intent.maxSolLamports)) add('INTENT_OUTFLOW_MISMATCH','high','Transfer exceeds your stated maximum',`Decoded direct SOL transfers total ${direct} lamports, above the stated ${intent.maxSolLamports}. Fees and other instructions are separate.`);
  }
  if(facts.status==='failed') for(const f of result) f.limitations.push('Transaction failed; instruction requests are not completed changes.');
  return result;
}

export function explanation(facts) {
  const attempted=facts.status==='failed'; const proposed=facts.status==='proposed';
  const verb=attempted?'Attempted':proposed?'Requests':'Transferred';
  const steps=facts.instructions.map(ix=>{
    const d=ix.decoded;
    if(ix.type==='sol_transfer') return {index:ix.index,text:`${verb} ${formatAmount(d.amount,9)} SOL from ${d.source} to ${d.destination}.`,kind:ix.type,source:d.source,destination:d.destination,amount:formatAmount(d.amount,9),asset:'SOL',effect:attempted?'not_executed':proposed?'proposed':'executed'};
    if(ix.type==='token_transfer') return {index:ix.index,text:`${verb} ${d.decimals===undefined?`${d.amount} raw token units`:formatAmount(d.amount,d.decimals)+' tokens'} from ${d.source} to ${d.destination}.`,kind:ix.type,source:d.source,destination:d.destination,amount:d.decimals===undefined?d.amount:formatAmount(d.amount,d.decimals),asset:d.mint||'unresolved mint',effect:attempted?'not_executed':proposed?'proposed':'executed'};
    if(ix.type==='token_approve') return {index:ix.index,text:`${attempted?'Attempted approval':'Approval request'}: delegate ${d.delegate} can spend up to ${d.amount} raw token units from ${d.source}.`,kind:ix.type};
    return {index:ix.index,text:ix.supported?`${ix.type.replaceAll('_',' ')} (${ix.programId}). Inspect the decoded fields for scope.`:`Unknown instruction in ${ix.programId}. Its effects are not fully decoded.`,kind:ix.type};
  });
  if(facts.feeLamports!==undefined) steps.push({index:'fee',kind:'fee',text:`Network fee: ${formatAmount(facts.feeLamports,9)} SOL (${facts.feeLamports} lamports). Charged to ${facts.feePayer}.`});
  return {headline:attempted?'Transaction failed; inspect the fee and error.':proposed?'Review these instructions before signing.':`${steps.filter(s=>s.kind.endsWith('transfer')).length} supported transfer(s) explained.`,steps,limitations:['Only supported instructions are explained. Net balance changes and instruction movements must not be added together.','A known program or successful execution does not certify safety.']};
}
