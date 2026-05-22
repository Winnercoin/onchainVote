import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "createPoll", type: "function", stateMutability: "nonpayable", inputs: [{ name: "question", type: "string" }, { name: "options", type: "string[]" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "vote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "pollId", type: "uint256" }, { name: "optionIndex", type: "uint256" }], outputs: [] },
  { name: "getRecentPolls", type: "function", stateMutability: "view", inputs: [{ name: "count", type: "uint256" }],
    outputs: [{ name: "", type: "tuple[]", components: [
      { name: "id", type: "uint256" }, { name: "creator", type: "address" }, { name: "question", type: "string" },
      { name: "options", type: "string[]" }, { name: "voteCounts", type: "uint256[]" }, { name: "createdAt", type: "uint256" }, { name: "totalVotes", type: "uint256" }
    ]}] },
  { name: "totalPolls", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

function timeAgo(ts: bigint) { const s=Math.floor(Date.now()/1000-Number(ts)); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; return`${Math.floor(s/3600)}h ago`; }

export default function App() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<"vote"|"create">("vote");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: polls, refetch } = useReadContract({ address: ADDR, abi: ABI, functionName: "getRecentPolls", args: [BigInt(10)], query: { refetchInterval: 15000 } });
  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalPolls" });

  if (isSuccess) { refetch(); setQuestion(""); setOptions(["",""]); }
  const pollList = (polls as any[] | undefined)?.slice().reverse() ?? [];
  const isLoading = isPending || isConfirming;

  const handleVote = (pollId: bigint, optionIndex: number) => {
    writeContract({ address: ADDR, abi: ABI, functionName: "vote", args: [pollId, BigInt(optionIndex)] });
    setVoted(v => ({ ...v, [pollId.toString()]: true }));
  };

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#f97316]/6 blur-[120px]" />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗳️</span>
          <span className="font-bold text-white text-lg">onchain<span className="text-[#f97316]">Vote</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🗳️</div>
          <h1 className="text-4xl font-black text-white mb-3">On-chain <span className="text-[#f97316]">Voting</span></h1>
          <p className="text-slate-400 text-sm">Create polls and vote on Arc. Results are transparent and tamper-proof.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ label: "Total Polls", value: total?.toString() ?? "—", icon: "🗳️" }, { label: "Network", value: "Arc", icon: "⛓️" }].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-white/8 rounded-xl px-4 py-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div><div className="text-white font-bold text-lg">{s.value}</div><div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-6">
          {(["vote","create"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab===t ? "bg-[#f97316] text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"}`}>
              {t === "vote" ? "🗳️ Browse Polls" : "➕ Create Poll"}
            </button>
          ))}
        </div>
        {tab === "create" ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Create a Poll 🗳️</h2>
            <div className="space-y-3 mb-4">
              <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Your poll question..." className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#f97316]/60 transition-all" />
              {options.map((opt, i) => (
                <input key={i} value={opt} onChange={e => { const o=[...options]; o[i]=e.target.value; setOptions(o); }} placeholder={`Option ${i+1}`} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#f97316]/60 transition-all" />
              ))}
              {options.length < 5 && (
                <button onClick={() => setOptions([...options,""])} className="text-[#f97316] text-sm hover:underline">+ Add option</button>
              )}
            </div>
            {!isConnected ? <p className="text-slate-500 text-sm text-center py-2">Connect wallet to create poll</p>
            : <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "createPoll", args: [question, options.filter(o=>o.trim())] })}
                disabled={isLoading || !question || options.filter(o=>o.trim()).length < 2}
                className="w-full py-3 rounded-xl font-bold text-sm bg-[#f97316] text-white hover:bg-[#fb923c] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                {isLoading ? <><svg className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />{isPending ? "Confirm…" : "Creating…"}</> : "🗳️ Create Poll"}
              </button>}
            {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {pollList.length === 0 && <div className="text-center py-12 text-slate-500"><p className="text-4xl mb-2">🗳️</p><p>No polls yet — create one!</p></div>}
            {pollList.map((p: any) => {
              const total = Number(p.totalVotes);
              const hasVotedLocal = voted[p.id.toString()];
              return (
                <div key={p.id.toString()} className="bg-slate-900/70 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-bold text-sm flex-1">{p.question}</h3>
                    <span className="text-slate-500 text-xs ml-2">{timeAgo(p.createdAt)}</span>
                  </div>
                  <div className="space-y-2">
                    {p.options.map((opt: string, i: number) => {
                      const count = Number(p.voteCounts[i]);
                      const pct = total > 0 ? Math.round(count/total*100) : 0;
                      return (
                        <button key={i} onClick={() => !hasVotedLocal && isConnected && handleVote(p.id, i)}
                          disabled={hasVotedLocal || !isConnected}
                          className="w-full text-left relative rounded-xl overflow-hidden border border-white/8 hover:border-[#f97316]/40 transition-all disabled:cursor-default">
                          <div className="absolute inset-y-0 left-0 bg-[#f97316]/20 transition-all" style={{width: `${pct}%`}} />
                          <div className="relative flex items-center justify-between px-4 py-2.5">
                            <span className="text-white text-sm">{opt}</span>
                            <span className="text-slate-400 text-xs">{pct}% ({count})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-slate-600 text-xs mt-3 font-mono">{p.creator.slice(0,6)}…{p.creator.slice(-4)} · {total} vote{total!==1?"s":""}</p>
                </div>
              );
            })}
          </div>
        )}
        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>Built on <a href="https://arc.network" className="hover:text-slate-400">Arc Network</a> · Chain ID {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}
