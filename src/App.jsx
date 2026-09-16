import { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────
const SB_URL = "https://rzivcbhjyxspfcuopjjb.supabase.co";
const SB_KEY = "sb_publishable_hE_FRwUG_Z40IYclv6SFYA_DNfLWFQU";
const supabase = createClient(SB_URL, SB_KEY);

// ── EmailJS ───────────────────────────────────────────────────
const EJS_SERVICE  = "service_f7cd7ma";
const EJS_TEMPLATE = "template_prggu9e";
const EJS_KEY      = "Jc6XKqOSgzxuJEs1G";
const ADMIN_EMAIL  = "cofundbills@gmail.com";
const ADMIN_NAME   = "CoFundBills Admin";

const sendEmail = async ({to_email, to_name, subject, message}) => {
  try {
    await emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
      to_email, to_name, subject, message,
      from_name: "CoFundBills Cooperative",
      reply_to: ADMIN_EMAIL,
    }, EJS_KEY);
  } catch(e) {
    console.error("EmailJS error:", e);
  }
};

// ── Constants ─────────────────────────────────────────────────
const ADMIN_PASS       = "CoFundBills2026@RoyalTech";
const MONTHLY_CONTRIB  = 10000;
const BENEFIT_POOL_AMT = 5000;   // 50% — member benefit pool
const BILL_SUPPORT_AMT = 2500;   // 25% — bill support fund
const LOAN_FUND_AMT    = 1000;   // 10% — loan fund
const ADMIN_AMT        = 1000;   // 10% — administration
const CONTINGENCY_AMT  = 500;    // 5%  — contingency reserve
const BILL_SCORE_MIN   = 1000;   // minimum credit score to claim
const BILL_SCORE_COST  = 500;    // credit points deducted per claim
const BILL_COOLDOWN    = 10;     // months (one cycle) before next claim

// Tiered cap based on fund balance
const getBillCap = (fundBalance) => {
  if(fundBalance >= 10000000) return { cap:500000, label:"₦500,000", tier:"Platinum", color:"#0B6E4F" };
  if(fundBalance >= 5000000)  return { cap:350000, label:"₦350,000", tier:"Gold",     color:"#C9A84C" };
  if(fundBalance >= 2000000)  return { cap:250000, label:"₦250,000", tier:"Silver",   color:"#6B7280" };
  return                             { cap:100000, label:"₦100,000", tier:"Bronze",   color:"#B45309" };
};
const CYCLE_MONTHS     = 10;
const BENEFIT_POOL_PCT = 0.60;
const CELL_TIMEOUT_DAYS= 30;

const CREDIT_PTS = {
  contribution:   { contributing:20 },
  cell_active:    { contributing:5, host:5, anchor:5, founding:5, admin:5 },
  cycle_complete: { contributing:100, host:50, anchor:30, founding:20, admin:10 },
  missed:         { contributing:-30 },
  loan_repaid:    { all:50 },
  loan_default:   { all:-100 },
};

// ── Colours ───────────────────────────────────────────────────
const C = {
  navy:"#0D2137", blue:"#1A4F8A", gold:"#C9A84C", green:"#0B6E4F",
  burg:"#7B1D1D", purple:"#7C3AED", amber:"#B45309", white:"#FFFFFF",
  dark:"#1A1A1A", muted:"#6B7280", error:"#9F1239", bg:"#F0F4FA", border:"#D0DAED",
};

const SEAT = {
  contributing: { bg:C.blue,  light:"#E8F0FA", label:"Contributing Member",  icon:"💳" },
  host:         { bg:C.green, light:"#E6F4EF", label:"Host",                 icon:"🔗" },
  anchor:       { bg:C.purple,light:"#F0E8FF", label:"Anchor",               icon:"⚓" },
  founding:     { bg:C.burg,  light:"#FDF2F2", label:"Root / Founding",      icon:"🎖️" },
  admin:        { bg:C.gold,  light:"#FFF9EC", label:"Admin",                icon:"🛡️" },
};

// ── Helpers ───────────────────────────────────────────────────
const fmtNGN = n => "₦" + Number(n||0).toLocaleString("en-NG");
const fmtPts = n => Number(n||0).toLocaleString() + " pts";
const genCode = pfx => pfx + Math.random().toString(36).substr(2,6).toUpperCase();
const daysSince = dt => dt ? Math.floor((Date.now()-new Date(dt))/(1000*60*60*24)) : 0;

const scoreCategory = score => {
  if(score>=1000) return {label:"Excellent",   rate:1, limit:600000, color:C.green};
  if(score>=700)  return {label:"Strong",      rate:2, limit:360000, color:C.blue};
  if(score>=500)  return {label:"Standard",    rate:3, limit:180000, color:C.amber};
  return                 {label:"Higher-Risk", rate:4, limit:60000,  color:C.error};
};

const mapMember = m => ({
  linkCode:m.link_code, fullName:m.full_name, email:m.email, phone:m.phone,
  occupation:m.occupation, address:m.address, state:m.state, country:m.country,
  nokName:m.nok_name, nokPhone:m.nok_phone, nokRelationship:m.nok_relationship,
  bankName:m.bank_name, accountName:m.account_name, accountNumber:m.account_number,
  memberType:m.member_type, status:m.status, refCode:m.ref_code,
  creditScore:Number(m.credit_score)||0,
  contributionBalance:Number(m.contribution_balance)||0,
  billSupportBalance:Number(m.bill_support_balance)||0,
  loanBalance:Number(m.loan_balance)||0,
  cyclesCompleted:Number(m.cycles_completed)||0,
  monthsContributed:Number(m.months_contributed)||0,
  joinedAt:m.joined_at, activatedAt:m.activated_at,
});

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:${C.bg};color:${C.dark};min-height:100vh}
.nav{background:${C.navy};padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:200;box-shadow:0 2px 12px rgba(13,33,55,.3)}
.nav-logo{color:${C.white};font-weight:900;font-size:17px;cursor:pointer;display:flex;align-items:center;gap:8px;user-select:none}
.nav-logo span{color:${C.gold}}
.nav-btns{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.btn{padding:9px 18px;border-radius:24px;border:none;cursor:pointer;font-weight:700;font-size:13px;transition:all .2s;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
.btn-gold{background:${C.gold};color:${C.navy}}
.btn-blue{background:${C.blue};color:${C.white}}
.btn-green{background:${C.green};color:${C.white}}
.btn-navy{background:${C.navy};color:${C.white}}
.btn-ghost{background:${C.bg};color:${C.navy};border:1.5px solid ${C.border}}
.btn-outline{background:transparent;color:${C.white};border:1.5px solid rgba(255,255,255,.4)}
.btn-outline:hover{background:rgba(255,255,255,.1)}
.btn-sm{padding:6px 12px;font-size:12px}
.btn-lg{padding:13px 30px;font-size:15px;border-radius:28px}
.btn-danger{background:#FEE2E2;color:${C.error};border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px}
.hero{background:linear-gradient(135deg,${C.navy} 0%,${C.blue} 100%);padding:70px 24px;text-align:center;color:${C.white}}
.hero h1{font-size:clamp(26px,5vw,50px);font-weight:900;line-height:1.15;margin-bottom:14px}
.hero h1 span{color:${C.gold}}
.hero p{font-size:15px;opacity:.85;max-width:540px;margin:0 auto 28px;line-height:1.75}
.hero-badge{display:inline-block;background:${C.gold};color:${C.navy};font-weight:900;font-size:15px;padding:9px 26px;border-radius:28px;margin-bottom:18px;box-shadow:0 4px 16px rgba(201,168,76,.4)}
.hero-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.section{padding:52px 24px}
.section-inner{max-width:900px;margin:0 auto}
.section-tag{display:inline-block;font-weight:800;font-size:11px;padding:5px 16px;border-radius:20px;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase}
.section-title{font-size:22px;font-weight:900;color:${C.navy};margin-bottom:8px}
.section-sub{color:${C.muted};font-size:14px;line-height:1.8;max-width:560px;margin-bottom:28px}
.card{background:${C.white};border-radius:14px;padding:22px;box-shadow:0 2px 12px rgba(13,33,55,.06);border:1px solid ${C.border}}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
.grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
.grid-4{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.stat-card{background:${C.white};border-radius:12px;padding:16px;text-align:center;border:1px solid ${C.border}}
.stat-val{font-size:20px;font-weight:900;color:${C.navy}}
.stat-lbl{font-size:11px;color:${C.muted};margin-top:3px;text-transform:uppercase;letter-spacing:.5px}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:700;color:${C.navy};margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px}
.field input,.field select,.field textarea{width:100%;padding:10px 13px;border:1.5px solid ${C.border};border-radius:10px;font-size:14px;font-family:inherit;outline:none;color:${C.dark};background:${C.white};transition:border-color .2s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:${C.blue}}
.field-err{border-color:${C.error}!important}
.err-msg{font-size:11px;color:${C.error};margin-top:3px}
.sec-div{font-weight:800;font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:1px;padding:6px 0;border-bottom:1px solid ${C.border};margin:18px 0 14px}
.pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.info-box{background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:13px;margin-bottom:14px;font-size:13px;color:${C.navy};line-height:1.7}
.success-box{background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:10px;padding:13px;margin-bottom:14px;font-size:13px;color:#166534;line-height:1.7}
.warn-box{background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:10px;padding:13px;margin-bottom:14px;font-size:13px;color:${C.error};line-height:1.7}
.portal-header{padding:24px;color:${C.white};margin-bottom:18px}
.portal-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.portal-tab{padding:7px 14px;border-radius:18px;border:1.5px solid ${C.border};background:${C.white};color:${C.muted};font-size:12px;font-weight:600;cursor:pointer;transition:all .2s}
.portal-tab.active{border-color:${C.blue};color:${C.white};background:${C.blue}}
.table-wrap{background:${C.white};border-radius:12px;overflow:hidden;border:1px solid ${C.border}}
.table-head{background:${C.bg};padding:10px 16px;font-size:11px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:.5px}
.table-row{padding:12px 16px;border-bottom:1px solid ${C.bg};font-size:13px}
.table-row:last-child{border-bottom:none}
.table-row:hover{background:${C.bg}}
.modal-overlay{position:fixed;inset:0;background:rgba(13,33,55,.72);z-index:1000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:30px 14px}
.modal{background:${C.white};border-radius:16px;width:100%;max-width:540px;overflow:hidden;box-shadow:0 8px 40px rgba(13,33,55,.3)}
.modal-hdr{background:linear-gradient(135deg,${C.navy},${C.blue});padding:18px 22px;color:${C.white}}
.modal-title{font-weight:900;font-size:17px}
.modal-sub{font-size:12px;opacity:.75;margin-top:3px}
.modal-body{padding:22px;max-height:68vh;overflow-y:auto}
.modal-foot{padding:14px 22px;border-top:1px solid ${C.border};display:flex;gap:8px;justify-content:flex-end;background:${C.bg}}
.cell-vis{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:12px}
.seat-dot{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${C.white};text-align:center;cursor:default;flex-direction:column;transition:transform .15s}
.seat-dot:hover{transform:scale(1.1)}
.score-bar{height:9px;border-radius:5px;background:${C.border};overflow:hidden;margin:5px 0}
.score-fill{height:100%;border-radius:5px;transition:width .5s}
.footer{background:${C.navy};color:rgba(255,255,255,.7);padding:36px 24px;text-align:center;font-size:13px;line-height:2}
.wa-btn{display:inline-flex;align-items:center;gap:7px;background:#25D366;color:${C.white};border-radius:28px;padding:12px 26px;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 4px 14px rgba(37,211,102,.4)}
@media(max-width:600px){.hero h1{font-size:24px}.hero-btns,.nav-btns{gap:6px}.btn-lg{padding:11px 22px;font-size:14px}}
`;

// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [view,        setView]        = useState("landing");
  const [member,      setMember]      = useState(null);
  const [members,     setMembers]     = useState({});
  const [cells,       setCells]       = useState([]);
  const [funds,       setFunds]       = useState({});
  const [loans,       setLoans]       = useState([]);
  const [billApps,    setBillApps]    = useState([]);
  const [analytics,   setAnalytics]   = useState([]);
  const [isAdmin,     setIsAdmin]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [modal,       setModal]       = useState(null);
  const [portalTab,   setPortalTab]   = useState("dashboard");
  const [adminTab,    setAdminTab]    = useState("members");
  const [faqOpen,     setFaqOpen]     = useState(false);
  const [tcOpen,      setTcOpen]      = useState(false);
  const [chatOpen,    setChatOpen]    = useState(false);
  const [chatMsgs,    setChatMsgs]    = useState([{role:"assistant",content:"👋 Hi! I am the CoFundBills Assistant. Ask me anything about contribution cells, credit scores, loans or bill support!"}]);
  const [chatInput,   setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [regForm,     setRegForm]     = useState({fullName:"",email:"",phone:"",occupation:"",address:"",state:"",country:"Nigeria",nokName:"",nokPhone:"",nokRelationship:"",bankName:"",accountName:"",accountNumber:""});
  const [regErrors,   setRegErrors]   = useState({});
  const [loginForm,   setLoginForm]   = useState({email:"",linkCode:""});
  const [loanForm,    setLoanForm]    = useState({amount:"",billType:"",purpose:""});
  const [billForm,    setBillForm]    = useState({billType:"",amount:"",description:""});

  const urlRef = new URLSearchParams(window.location.search).get("ref")||"";

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 4000);
  };

  // ── Data loaders ─────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    const {data} = await supabase.from("cfb_members").select("*");
    const map = {};
    (data||[]).forEach(m => { map[m.link_code] = mapMember(m); });
    setMembers(map);
    return map;
  }, []);

  const loadCells = useCallback(async () => {
    const {data:cData} = await supabase.from("cfb_cells").select("*").order("created_at",{ascending:false});
    const {data:sData} = await supabase.from("cfb_cell_members").select("*");
    const result = (cData||[]).map(c=>({...c, seats:(sData||[]).filter(s=>s.cell_code===c.cell_code)}));
    setCells(result);
    return result;
  }, []);

  const loadFunds = useCallback(async () => {
    const {data} = await supabase.from("cfb_funds").select("*");
    const map = {};
    (data||[]).forEach(f => { map[f.fund_type] = Number(f.balance)||0; });
    setFunds(map);
    return map;
  }, []);

  const loadLoans = useCallback(async () => {
    const {data} = await supabase.from("cfb_loans").select("*").order("requested_at",{ascending:false});
    setLoans(data||[]);
    return data||[];
  }, []);

  const loadBillApps = useCallback(async () => {
    const {data} = await supabase.from("cfb_bill_support").select("*").order("requested_at",{ascending:false});
    setBillApps(data||[]);
    return data||[];
  }, []);

  useEffect(() => {
    loadMembers(); loadCells(); loadFunds(); loadLoans(); loadBillApps();
  }, []);

  // ── Visitor tracking ─────────────────────────────────────────
  useEffect(() => {
    supabase.from("cfb_visitors").insert({
      page:view, ref_code:urlRef||null,
      user_agent:navigator.userAgent,
      screen:`${window.screen.width}x${window.screen.height}`,
      language:navigator.language, referrer:document.referrer||null,
    }).then(()=>{});
  }, [view]);

  // ── Credit event ──────────────────────────────────────────────
  const addCredit = async (linkCode, eventType, seatType, cellCode, desc) => {
    const map = CREDIT_PTS[eventType]||{};
    const pts = map[seatType] ?? map.all ?? 0;
    if(pts===0) return;
    await supabase.from("cfb_credit_events").insert({
      link_code:linkCode, event_type:eventType, points:pts,
      cell_code:cellCode, seat_type:seatType, description:desc,
    });
    const cur = members[linkCode]?.creditScore||0;
    await supabase.from("cfb_members").update({
      credit_score: Math.max(0, cur+pts)
    }).eq("link_code", linkCode);
  };

  // ── Determine network seats from ref chain ────────────────────
  const resolveChain = (firstMemberRefCode, allMembers) => {
    // Chain: Host → Anchor → Root/Founding → Admin (always last)
    // Founding Members occupy the Root/Founding seat
    // Admin always closes the chain as the last leg
    const chain = [];
    const regularSeats = ["host","anchor"];
    let cur = firstMemberRefCode;
    let idx = 0;

    while(cur && idx < 2) {
      const m = allMembers[cur];
      if(!m || m.status!=="active") break;
      if(m.memberType==="admin") {
        // Admin reached before filling host/anchor — Admin takes last leg
        chain.push({linkCode:cur, seatType:"admin"});
        return chain;
      }
      if(m.memberType==="founding") {
        // Founding Member fills next available seat (host or anchor)
        // then Admin takes last leg
        chain.push({linkCode:cur, seatType:idx===0?"host":"anchor"});
        // Now find Admin for last leg
        let adminCur = m.refCode;
        while(adminCur) {
          const parent = allMembers[adminCur];
          if(!parent) break;
          if(parent.memberType==="admin") {
            chain.push({linkCode:adminCur, seatType:"admin"});
            break;
          }
          adminCur = parent.refCode;
        }
        // If no admin found via chain, seat first active admin
        if(!chain.some(c=>allMembers[c.linkCode]?.memberType==="admin")) {
          const admin = Object.values(allMembers).find(m=>m.memberType==="admin"&&m.status==="active");
          if(admin) chain.push({linkCode:admin.linkCode, seatType:"admin"});
        }
        return chain;
      }
      chain.push({linkCode:cur, seatType:regularSeats[idx]});
      cur = m.refCode;
      idx++;
    }

    // After host/anchor — look for founding member then admin
    if(cur) {
      const m = allMembers[cur];
      if(m && m.status==="active") {
        if(m.memberType==="founding") {
          chain.push({linkCode:cur, seatType:"founding"});
          cur = m.refCode;
        }
      }
    }

    // Find admin for last leg — walk up remaining chain
    let adminFound = false;
    while(cur && !adminFound) {
      const m = allMembers[cur];
      if(!m) break;
      if(m.memberType==="admin") {
        chain.push({linkCode:cur, seatType:"admin"});
        adminFound = true;
      }
      cur = m.refCode;
    }
    // Fallback — seat first active admin
    if(!adminFound) {
      const admin = Object.values(allMembers).find(m=>m.memberType==="admin"&&m.status==="active");
      if(admin) chain.push({linkCode:admin.linkCode, seatType:"admin"});
    }

    return chain;
  };

  // ── Try to form a cell ────────────────────────────────────────
  const tryFormCell = async (allMembers, allCells) => {
    // Get all active regular members not yet in an active/forming cell
    const seatedCodes = new Set();
    (allCells||[]).filter(c=>c.status!=="completed").forEach(c=>{
      (c.seats||[]).filter(s=>s.seat_type==="contributing").forEach(s=>seatedCodes.add(s.link_code));
    });
    const unplaced = Object.values(allMembers).filter(m=>
      m.status==="active" && m.memberType==="regular" && !seatedCodes.has(m.linkCode)
    ).sort((a,b)=>new Date(a.activatedAt)-new Date(b.activatedAt));

    if(unplaced.length < 10) return; // not enough yet

    const contributors = unplaced.slice(0,10);
    const cellCode = genCode("CELL-");
    await supabase.from("cfb_cells").insert({
      cell_code:cellCode, status:"active",
      started_at:new Date().toISOString(), month_number:1,
      first_member_at:new Date().toISOString(),
    });

    // Seat contributing members
    for(const m of contributors) {
      await supabase.from("cfb_cell_members").insert({
        cell_code:cellCode, link_code:m.linkCode, seat_type:"contributing"
      });
    }

    // Resolve network chain from first contributor's ref
    const chain = resolveChain(contributors[0].refCode, allMembers);
    for(const s of chain) {
      // Avoid duplicate seat
      const exists = await supabase.from("cfb_cell_members")
        .select("id").eq("cell_code",cellCode).eq("link_code",s.linkCode).single();
      if(!exists.data) {
        await supabase.from("cfb_cell_members").insert({
          cell_code:cellCode, link_code:s.linkCode, seat_type:s.seatType
        });
        await addCredit(s.linkCode,"cell_active",s.seatType,cellCode,"Cell formed");
      }
    }

    await loadCells();
    showToast(`New contribution cell ${cellCode} formed with ${10+chain.length} members!`);
  };

  // ── Merger engine ─────────────────────────────────────────────
  const runMergerCheck = async (allMembers, allCells) => {
    const forming = (allCells||[]).filter(c=>c.status==="forming");
    const overdue = forming.filter(c=>daysSince(c.first_member_at)>=CELL_TIMEOUT_DAYS);
    if(overdue.length<2) return;

    // Sort: overdue/priority first, then by contributor count desc
    const sorted = [...overdue].sort((a,b)=>{
      const aC = (a.seats||[]).filter(s=>s.seat_type==="contributing").length;
      const bC = (b.seats||[]).filter(s=>s.seat_type==="contributing").length;
      if(b.is_priority && !a.is_priority) return 1;
      if(a.is_priority && !b.is_priority) return -1;
      return bC - aC;
    });

    const bigger = sorted[0];
    const smaller = sorted[1];
    const bigContribs = (bigger.seats||[]).filter(s=>s.seat_type==="contributing").map(s=>s.link_code);
    const smallContribs = (smaller.seats||[]).filter(s=>s.seat_type==="contributing").map(s=>s.link_code);

    const slotsAvailable = 10 - bigContribs.length;
    const toMerge = smallContribs.slice(0, slotsAvailable);
    const overflow = smallContribs.slice(slotsAvailable);

    // Move toMerge into bigger cell
    for(const lc of toMerge) {
      await supabase.from("cfb_cell_members")
        .update({cell_code:bigger.cell_code})
        .eq("cell_code",smaller.cell_code).eq("link_code",lc);
    }

    // Remove smaller cell's network positions (suspend, not delete)
    await supabase.from("cfb_cell_members")
      .delete()
      .eq("cell_code",smaller.cell_code)
      .in("seat_type",["host","anchor","root","founding"]);

    // If bigger cell now has 10 contributors — activate it
    const newCount = bigContribs.length + toMerge.length;
    if(newCount>=10) {
      await supabase.from("cfb_cells").update({
        status:"active", started_at:new Date().toISOString(), month_number:1
      }).eq("cell_code",bigger.cell_code);
      showToast(`Cell ${bigger.cell_code} activated after merger!`);
    }

    // Handle overflow — return to smaller cell with priority flag
    if(overflow.length>0) {
      await supabase.from("cfb_cells").update({
        is_priority:true, first_member_at:new Date().toISOString()
      }).eq("cell_code",smaller.cell_code);
      // Remove merged members from smaller cell
      for(const lc of toMerge) {
        await supabase.from("cfb_cell_members")
          .delete()
          .eq("cell_code",smaller.cell_code).eq("link_code",lc);
      }
      showToast(`${overflow.length} member(s) retained in ${smaller.cell_code} with priority status.`);
    } else {
      // Smaller cell fully merged — mark completed
      await supabase.from("cfb_cells").update({status:"completed"}).eq("cell_code",smaller.cell_code);
    }

    await loadCells();
  };

  // ── Registration ──────────────────────────────────────────────
  const handleRegister = async () => {
    const errs = {};
    ["fullName","email","phone","occupation","address","state",
     "nokName","nokPhone","nokRelationship","bankName","accountName","accountNumber"]
      .forEach(k=>{ if(!regForm[k].trim()) errs[k]="Required"; });
    if(!/\S+@\S+\.\S+/.test(regForm.email)) errs.email="Invalid email";
    if(Object.keys(errs).length){ setRegErrors(errs); return; }
    setLoading(true);
    const linkCode = genCode("CFB-");
    const {error} = await supabase.from("cfb_members").insert({
      link_code:linkCode, full_name:regForm.fullName.trim(),
      email:regForm.email.trim().toLowerCase(), phone:regForm.phone.trim(),
      occupation:regForm.occupation.trim(), address:regForm.address.trim(),
      state:regForm.state.trim(), country:regForm.country,
      nok_name:regForm.nokName.trim(), nok_phone:regForm.nokPhone.trim(),
      nok_relationship:regForm.nokRelationship.trim(),
      bank_name:regForm.bankName.trim(), account_name:regForm.accountName.trim(),
      account_number:regForm.accountNumber.trim(),
      ref_code:urlRef||null, status:"pending", member_type:"regular",
    });
    setLoading(false);
    if(error){ showToast(error.message||"Registration failed","error"); return; }
    const saved = {linkCode, name:regForm.fullName.trim()};
    // Email to admin
    await sendEmail({
      to_email: ADMIN_EMAIL, to_name: ADMIN_NAME,
      subject: `New CoFundBills Registration — ${regForm.fullName.trim()}`,
      message: `New member registered:\n\nName: ${regForm.fullName.trim()}\nEmail: ${regForm.email.trim()}\nPhone: ${regForm.phone.trim()}\nLink Code: ${linkCode}\nOccupation: ${regForm.occupation.trim()}\nAddress: ${regForm.address.trim()}\nState: ${regForm.state.trim()}\nCountry: ${regForm.country}\nNOK: ${regForm.nokName.trim()} (${regForm.nokRelationship.trim()}) — ${regForm.nokPhone.trim()}\nBank: ${regForm.bankName.trim()} | ${regForm.accountName.trim()} | ${regForm.accountNumber.trim()}\nReferred by: ${urlRef||"Direct"}\n\nACTION REQUIRED: Verify payment of NGN10,000 then activate membership in admin dashboard.`,
    });
    // Member email handled manually via cofundbills@gmail.com
    setRegForm({fullName:"",email:"",phone:"",occupation:"",address:"",state:"",country:"Nigeria",
      nokName:"",nokPhone:"",nokRelationship:"",bankName:"",accountName:"",accountNumber:""});
    setRegErrors({});
    await loadMembers();
    setModal({type:"regSuccess", ...saved});
  };

  // ── Login ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    if(!loginForm.email.trim()&&!loginForm.linkCode.trim()){
      showToast("Enter your email or link code","error"); return;
    }
    setLoading(true);
    let q = supabase.from("cfb_members").select("*");
    if(loginForm.linkCode.trim()) q = q.eq("link_code",loginForm.linkCode.trim().toUpperCase());
    else q = q.eq("email",loginForm.email.trim().toLowerCase());
    const {data} = await q.single();
    setLoading(false);
    if(!data){ showToast("Member not found","error"); return; }
    setMember(mapMember(data));
    setPortalTab("dashboard");
    setView("portal");
    setModal(null);
  };

  // ── Admin activate ────────────────────────────────────────────
  const handleActivate = async code => {
    await supabase.from("cfb_members").update({
      status:"active", activated_at:new Date().toISOString()
    }).eq("link_code",code);
    await addCredit(code,"contribution","contributing",null,"Account activated");
    // Activation email sent manually from cofundbills@gmail.com
    const allM = await loadMembers();
    const allC = await loadCells();
    await tryFormCell(allM, allC);
    await runMergerCheck(allM, allC);
    showToast(`${allM[code]?.fullName||code} activated.`);
  };

  // ── Make founding member ──────────────────────────────────────
  const handleMakeFounding = async code => {
    await supabase.from("cfb_members").update({member_type:"founding"}).eq("link_code",code);
    await loadMembers();
    showToast("Upgraded to Founding Member.");
  };

  // ── Record contribution ───────────────────────────────────────
  const handleRecordContrib = async (cellCode, linkCode) => {
    const cell = cells.find(c=>c.cell_code===cellCode);
    if(!cell) return;
    const monthNum = cell.month_number||1;
    await supabase.from("cfb_contributions").insert({
      cell_code:cellCode, link_code:linkCode, month_number:monthNum,
      amount:MONTHLY_CONTRIB,
      benefit_pool:BENEFIT_POOL_AMT,
      bill_support:BILL_SUPPORT_AMT,
      loan_fund:LOAN_FUND_AMT,
      administration:ADMIN_AMT,
      contingency:CONTINGENCY_AMT,
      status:"confirmed", confirmed_at:new Date().toISOString(),
    });
    // Update member's contribution balance and months
    const m = members[linkCode];
    await supabase.from("cfb_members").update({
      months_contributed:(m?.monthsContributed||0)+1,
      contribution_balance:(m?.contributionBalance||0)+BENEFIT_POOL_AMT,
    }).eq("link_code",linkCode);
    // Credit all seat holders
    const seats = cell.seats||[];
    for(const s of seats) {
      await addCredit(s.link_code,"cell_active",s.seat_type,cellCode,`Month ${monthNum}`);
    }
    await addCredit(linkCode,"contribution","contributing",cellCode,`Month ${monthNum} contribution`);
    // Update funds
    await supabase.from("cfb_funds").update({balance:(funds.bill_support||0)+BILL_SUPPORT_AMT}).eq("fund_type","bill_support");
    await supabase.from("cfb_funds").update({balance:(funds.loan_fund||0)+LOAN_FUND_AMT}).eq("fund_type","loan_fund");
    await supabase.from("cfb_funds").update({balance:(funds.administration||0)+ADMIN_AMT}).eq("fund_type","administration");
    await supabase.from("cfb_funds").update({balance:(funds.contingency||0)+CONTINGENCY_AMT}).eq("fund_type","contingency");
    // Check cycle completion
    const {data:contribs} = await supabase.from("cfb_contributions")
      .select("id").eq("cell_code",cellCode).eq("status","confirmed");
    const contribCount = (contribs||[]).length;
    const targetContribs = seats.filter(s=>s.seat_type==="contributing").length * CYCLE_MONTHS;
    if(contribCount >= targetContribs) {
      await completeCycle(cellCode, seats);
    } else {
      const nextMonth = Math.ceil(contribCount / seats.filter(s=>s.seat_type==="contributing").length)+1;
      await supabase.from("cfb_cells").update({month_number:nextMonth}).eq("cell_code",cellCode);
    }
    await loadMembers(); await loadCells(); await loadFunds();
    showToast("Contribution recorded.");
  };

  const completeCycle = async (cellCode, seats) => {
    const contributors = seats.filter(s=>s.seat_type==="contributing");
    for(const c of contributors) {
      await supabase.from("cfb_payouts").insert({
        cell_code:cellCode, link_code:c.link_code, amount:50000, status:"pending"
      });
      await supabase.from("cfb_members").update({
        cycles_completed:(members[c.link_code]?.cyclesCompleted||0)+1
      }).eq("link_code",c.link_code);
      await addCredit(c.link_code,"cycle_complete","contributing",cellCode,"Cycle completed");
    }
    for(const s of seats.filter(s=>s.seat_type!=="contributing")) {
      await addCredit(s.link_code,"cycle_complete",s.seat_type,cellCode,"Cycle completed");
    }
    await supabase.from("cfb_cells").update({
      status:"completed", completed_at:new Date().toISOString()
    }).eq("cell_code",cellCode);
    showToast(`Cell ${cellCode} cycle completed! Payouts queued.`);
  };

  // ── Loan application ──────────────────────────────────────────
  const handleLoanApply = async () => {
    if(!loanForm.amount||!loanForm.billType){ showToast("Fill all required fields","error"); return; }
    const m = member;
    const cat = scoreCategory(m.creditScore);
    const maxLoan = cat.limit;
    const amt = Number(loanForm.amount);
    if(amt>maxLoan){ showToast(`Max loan for your category: ${fmtNGN(maxLoan)}`,"error"); return; }
    if(amt>(funds.loan_fund||0)){ showToast("Insufficient loan fund liquidity","error"); return; }
    await supabase.from("cfb_loans").insert({
      link_code:m.linkCode, amount:amt, interest_rate:cat.rate,
      credit_category:cat.label, purpose:loanForm.purpose||loanForm.billType,
      bill_type:loanForm.billType, total_repayable:amt*(1+cat.rate/100*3),
      months_term:3, status:"pending",
    });
    setLoanForm({amount:"",billType:"",purpose:""});
    await sendEmail({
      to_email: ADMIN_EMAIL, to_name: ADMIN_NAME,
      subject: `CoFundBills Loan Application — ${member.fullName}`,
      message: `Loan application received:\nMember: ${member.fullName}\nLink Code: ${member.linkCode}\nAmount: ₦${Number(loanForm.amount).toLocaleString()}\nPurpose: ${loanForm.billType}\nCredit Category: ${cat.label}\nRate: ${cat.rate}%/month\nTotal Repayable: ₦${(Number(loanForm.amount)*(1+cat.rate/100*3)).toLocaleString()}\nCredit Score: ${member.creditScore} pts`,
    });
    await loadLoans();
    showToast("Loan application submitted.");
    setPortalTab("dashboard");
  };

  // ── Bill support ──────────────────────────────────────────────
  const handleBillApply = async () => {
    if(!billForm.billType||!billForm.amount){ showToast("Fill all required fields","error"); return; }
    if(member.creditScore < BILL_SCORE_MIN){ showToast(`Credit score of ${BILL_SCORE_MIN} pts required to apply`,"error"); return; }
    const tierCap = getBillCap(funds.bill_support||0);
    const amt = Number(billForm.amount);
    if(amt > tierCap.cap){ showToast(`Maximum claim is ${tierCap.label} at current fund level`,"error"); return; }
    await supabase.from("cfb_bill_support").insert({
      link_code:member.linkCode, bill_type:billForm.billType,
      amount_requested:amt, description:billForm.description, status:"pending",
    });
    setBillForm({billType:"",amount:"",description:""});
    const tierCapEmail = getBillCap(funds.bill_support||0);
    await sendEmail({
      to_email: ADMIN_EMAIL, to_name: ADMIN_NAME,
      subject: `CoFundBills Bill Support Application — ${member.fullName}`,
      message: `Bill support application received:\n\nMember: ${member.fullName}\nLink Code: ${member.linkCode}\nCredit Score: ${member.creditScore} pts (${scoreCategory(member.creditScore).label})\nBill Type: ${billForm.billType}\nAmount Requested: ₦${Number(billForm.amount).toLocaleString()}\nCurrent Fund Tier: ${tierCapEmail.tier} (Max: ${tierCapEmail.label})\nFund Balance: ₦${(funds.bill_support||0).toLocaleString()}\nDescription: ${billForm.description||"None provided"}\n\nACTION: Approving will deduct 500 credit points from member and ₦${Number(billForm.amount).toLocaleString()} from the Bill Support Fund.`,
    });
    await loadBillApps();
    showToast("Bill support application submitted.");
    setPortalTab("dashboard");
  };

  // ── AI Chat ───────────────────────────────────────────────────
  const CHAT_SYSTEM = `You are the CoFundBills Cooperative Assistant. CoFundBills is a member-owned digital cooperative platform being registered under Lagos State Cooperative Societies Law 2022.

CORE LEGAL PRINCIPLE: No member earns cash from another member's contributions. Host, Anchor, Root and Founding Member positions earn cooperative credit points only — never cash.

CONTRIBUTION CELL STRUCTURE (dynamic, 10 to 14 members):
- 10 Contributing Members — pay NGN10,000/month for 10 months, receive NGN50,000 cash + 250 credit points at cycle end
- Host — the member whose invite link brought contributors to this cell. Credit points only.
- Anchor — the member who introduced the Host. Credit points only.
- Root — the member who introduced the Anchor. Credit points only.
- Founding Member — seats in the furthest traceable network position. Credit points only.
Cell size depends on actual invite chain depth: 10 (admin-direct), 11, 12, 13 or 14 members.

CONTRIBUTION SPLIT per NGN10,000:
- Member Benefit Pool: NGN5,000 (50%) — paid equally to contributing members at cycle end
- Bill Support Fund: NGN2,500 (25%)
- Loan Fund: NGN1,000 (10%)
- Administration: NGN1,000 (10%)
- Contingency Reserve: NGN500 (5%)

CYCLE PAYOUT: NGN60,000 per contributing member after 10 months. They contributed NGN100,000.

CELL FORMATION: Cells form automatically when 10 active unplaced contributing members are available.
MERGER RULE: Forming cells over 30 days old without 10 contributors merge — more populated absorbs less populated. Network positions of more populated cell are kept.

CREDIT SCORE (behaviour-based, NOT recruitment-based):
- Monthly contribution on time: +20 pts (contributing members)
- Each month cell is active: +5/5/3/2/1 pts (contributing/host/anchor/root/founding)
- Cycle completed: +100/50/30/20/10 pts
- Missed contribution: -30 pts
- Loan repaid: +50 pts all
- Loan default: -100 pts all

LOAN ACCESS (based on credit score):
- Excellent 800+: 1%/month, max loan NGN600,000
- Strong 600-799: 2%/month, max loan NGN360,000
- Standard 400-599: 3%/month, max loan NGN180,000
- Higher-Risk below 400: 4%/month, max loan NGN60,000
Loans subject to fund liquidity and admin approval. Credits improve eligibility — do not guarantee approval.

IS IT A PYRAMID SCHEME? No — because:
1. Nobody earns cash from recruiting others
2. Platform functions with zero new members
3. Earnings from cycle completion, not recruitment
4. Credit score rewards behaviour not position
5. Registered cooperative under Lagos State law
6. Every naira has a documented destination

REGISTRATION: Free. Activate with NGN10,000 to Royal Tech Partnership & Investment Ltd, Zenith Bank, 1016621205. WhatsApp +234 909 999 4816.

Answer warmly, concisely and accurately. Never invent information.`;

  const handleChat = async () => {
    if(!chatInput.trim()||chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMsgs = [...chatMsgs,{role:"user",content:userMsg}];
    setChatMsgs(newMsgs);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat.mjs",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({system:CHAT_SYSTEM, messages:newMsgs.slice(-10).map(m=>({role:m.role,content:m.content}))}),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text||"Sorry, please WhatsApp +234 909 999 4816.";
      setChatMsgs([...newMsgs,{role:"assistant",content:reply}]);
    } catch(e) {
      setChatMsgs([...newMsgs,{role:"assistant",content:"Connection issue. Please WhatsApp +234 909 999 4816."}]);
    }
    setChatLoading(false);
  };

  // ── Cell Visual Component ─────────────────────────────────────
  const CellVisual = ({cell}) => {
    const seats = cell.seats||[];
    const contribs  = seats.filter(s=>s.seat_type==="contributing");
    const netSeats  = seats.filter(s=>s.seat_type!=="contributing");
    const empty     = Math.max(0, 10-contribs.length);
    const pct       = Math.round((cell.month_number||0)/CYCLE_MONTHS*100);
    return(
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div>
            <div style={{fontWeight:800,color:C.navy,fontSize:13}}>{cell.cell_code}</div>
            <div style={{fontSize:11,color:C.muted}}>{seats.length} members · Month {cell.month_number||0}/{CYCLE_MONTHS}{cell.is_priority?" · 🔴 Priority":""}</div>
          </div>
          <span className="pill" style={{
            background:cell.status==="active"?"#BBF7D0":cell.status==="completed"?"#BFDBFE":cell.is_priority?"#FEE2E2":"#FEF3C7",
            color:cell.status==="active"?"#166534":cell.status==="completed"?C.blue:cell.is_priority?C.error:"#92400E",
          }}>{cell.is_priority&&cell.status==="forming"?"Priority":cell.status}</span>
        </div>
        {/* Cycle progress */}
        {cell.status==="active"&&(
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:3}}>
              <span>Cycle progress</span><span>{pct}%</span>
            </div>
            <div className="score-bar"><div className="score-fill" style={{width:pct+"%",background:C.blue}}/></div>
          </div>
        )}
        {/* Seat dots */}
        <div className="cell-vis">
          {contribs.map((s,i)=>{
            const col = SEAT.contributing;
            const name = (members[s.link_code]?.fullName||"?").split(" ").map(w=>w[0]).join("").slice(0,2);
            return <div key={i} className="seat-dot" style={{background:col.bg}} title={`${members[s.link_code]?.fullName||s.link_code} (Contributing)`}>{name}</div>;
          })}
          {Array.from({length:empty}).map((_,i)=>(
            <div key={"e"+i} className="seat-dot" style={{background:"#E5E7EB",border:"2px dashed #9CA3AF",color:C.muted}}>?</div>
          ))}
          {netSeats.map((s,i)=>{
            const col = SEAT[s.seat_type]||SEAT.founding;
            const name = (members[s.link_code]?.fullName||"?").split(" ").map(w=>w[0]).join("").slice(0,2);
            return <div key={"n"+i} className="seat-dot" style={{background:col.bg,border:`2px solid ${C.gold}`}} title={`${members[s.link_code]?.fullName||s.link_code} (${col.label})`}>{name}</div>;
          })}
        </div>
        {/* Legend */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",marginTop:6}}>
          {Object.entries(SEAT).map(([k,v])=>(
            <span key={k} style={{fontSize:10,display:"flex",alignItems:"center",gap:3,color:C.muted}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:v.bg,display:"inline-block"}}/>{v.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ── FAQ data ──────────────────────────────────────────────────
  const FAQS = [
    ["What is CoFundBills Cooperative?","CoFundBills is a member-owned digital cooperative platform that organises members into contribution cells. Ten members contribute ₦10,000 monthly for 10 months and share a ₦50,000 cash payout each at cycle end, plus 250 credit points. The cooperative also provides a loan facility, bill support fund and a behaviour-based credit scoring system."],
    ["What is a Contribution Cell?","A contribution cell is a group of 10 contributing members who each pay ₦10,000/month for 10 months, plus up to 4 network position holders (Host, Anchor, Root/Founding Member, and Admin) whose invite chains led to the cell's formation. Root and Founding Member occupy the same seat — all Founding Members sit in the Root/Founding position. Admin always closes the chain as the last leg. Cell size ranges from 10 to 13 members depending on the depth of the invite chain above the contributing members."],
    ["How much do I receive at cycle end?","Each contributing member receives ₦50,000 cash at cycle end, plus 250 credit points (20 per month × 10 months + 100 cycle completion bonus). You will have contributed ₦100,000 in total. The ₦50,000 difference funds the cooperative: bill support (25% — ₦2,500/month), loan fund (10%), administration (10%) and contingency reserve (5%) for default payments, operational shocks and make-up funds."],
    ["What do Host, Anchor, Root and Founding Member receive?","These are network positions earned by existing active members whose invite chain led to the cell's formation. They earn cooperative credit points only — no cash from contributions. Credit points build their CoFund Credit Score which determines their loan rate and loan limit."],
    ["What is the CoFund Credit Score?","Your credit score is built from your cooperative behaviour: +20 per monthly contribution (contributing members), +5 per active cell month equally across all seat types, +100 for a completed cycle (contributing members) with lower bonuses for network seat holders. Deductions for missed contributions (−30), loan defaults (−100) and bill support claims (−500). A higher score gives better loan access, lower interest rates and unlocks bill support eligibility at 1,000+ points."],
    ["What loan can I access?","Based on your CoFund Credit Score: Excellent (1,000+): 1%/month, max ₦600,000. Strong (700–999): 2%/month, max ₦360,000. Standard (500–699): 3%/month, max ₦180,000. Higher-Risk (below 500): 4%/month, max ₦60,000. Loan approval is subject to available fund liquidity, repayment capacity and cooperative credit policy. Credits improve eligibility — they do not guarantee approval."],
    ["What is the Bill Support Fund?","25% of every contribution (₦2,500 per ₦10,000 paid) funds the cooperative's Bill Support Fund. Active members can apply for support for house rent, school fees, medical bills, electricity, water and household essentials. Applications are reviewed by admin."],
    ["What is the cell merger rule?","If a forming cell has not reached 10 contributing members within 30 days, it becomes eligible for merger. The more populated cell absorbs the less populated. The merged cell adopts the network positions of the more populated cell. Members who do not get a seat in the merger return to their original cell with priority status for the next merger."],
    ["Is CoFundBills a Pyramid Scheme?","No — CoFundBills is not a pyramid scheme. Host, Anchor and Root earn credit points only — never cash from contributors below them. The cooperative functions with zero new members. Earnings come from cycle completion — not from recruiting others. The credit score rewards contribution discipline and repayment history. CoFundBills is being registered as a Multi-Purpose Cooperative Society under Lagos State law. Every naira has a documented destination."],
    ["How do I activate my membership?","After registering, make your first monthly contribution of ₦10,000 to: Royal Tech Partnership & Investment Limited, Zenith Bank, Account 1016621205. Use your link code as reference. WhatsApp +234 909 999 4816. Admin activates your account and you are automatically placed in a forming cell."],
  ];

  // ── T&C sections ──────────────────────────────────────────────
  const TCS = [
    ["1. Membership","Membership is open to individuals who register through the platform and pay the first monthly contribution of ₦10,000. Membership is personal and non-transferable."],
    ["2. Contribution Obligation","Contributing members must pay ₦10,000 monthly for the full 10-month cycle. Failure to contribute suspends cycle payout eligibility and cooperative service access until arrears are cleared."],
    ["3. Contribution Cell","Members are automatically assigned to a contribution cell upon activation. Cell size ranges from 10 to 14 members. The cycle runs for 10 months."],
    ["4. Contribution Split","Every ₦10,000: Member Benefit Pool 50% (₦5,000), Bill Support Fund 25% (₦2,500), Loan Fund 10% (₦1,000), Administration 10% (₦1,000), Contingency Reserve 5% (₦500)."],
    ["5. Cycle Payout","₦50,000 cash is paid to each contributing member at cycle completion, plus 250 credit points earned during the cycle. Payouts are processed within 7 business days of cycle completion."],
    ["6. Network Positions","Host, Anchor, Root and Founding Member earn cooperative credit points only. No member receives a commission or guaranteed financial return for introducing another member."],
    ["7. CoFund Credit Score","The credit score is an internal cooperative participation assessment. It is not a deposit, share, investment, cryptocurrency or guaranteed cash entitlement. It determines loan eligibility only."],
    ["8. Co-Fund Loan","Loans are subject to credit score assessment, available fund liquidity and cooperative credit policy. Credit points improve eligibility but do not guarantee approval."],
    ["9. Bill Support","Bill support applications are subject to available fund balance and admin approval. Bill support is not an entitlement."],
    ["10. Cell Merger","Forming cells over 30 days old without 10 contributing members are eligible for merger. The cooperative reserves the right to merge cells in accordance with these rules to ensure timely cell formation for all members."],
    ["11. Suspension of Rights","Failure to contribute in any month suspends cycle payout eligibility for that period. Suspended credits are transferred to the Loan Fund Pool."],
    ["12. No Guaranteed Returns","CoFundBills does not guarantee any return on contributions. Cycle payouts depend on the successful completion of a full 10-month contribution cycle."],
    ["13. Governing Law","These Terms are governed by the laws of Nigeria and the Lagos State Cooperative Societies Law 2022."],
  ];

  // ══════════════════════════════════════════════════════════════
  // ── Landing Page ──────────────────────────────────────────────
  const Landing = () => (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">🤝 CoFundBills Cooperative</div>
        <h1>Don't Face Bills Alone.<br/><span>Let's Co-Fund Them.</span></h1>
        <p>A member-owned digital cooperative platform using disciplined contribution cells to build shared financial capacity — for bill support, cooperative credit and collective financial empowerment.</p>
        <div className="hero-btns">
          <button className="btn btn-gold btn-lg" onClick={()=>setModal({type:"register"})}>Join Free Today</button>
          <button className="btn btn-outline btn-lg" onClick={()=>setModal({type:"login"})}>Log In to My Portal</button>
          <a className="wa-btn" href="https://wa.me/2348061631222?text=Hello%2C%20I%20have%20a%20question%20about%20CoFundBills" target="_blank" rel="noopener noreferrer">💬 Chat with Admin</a>
        </div>
      </div>

      {/* Stats belt */}
      <div style={{background:C.navy,padding:"18px 24px",display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
        {[["₦10,000","Monthly Contribution"],["₦50,000 + 250 pts","Cycle Payout / Credit Bonus"],["10 Months","Contribution Cycle"],["10–14","Members Per Cell"],["1%–4%","Loan Rate/Month"],["50%","Benefit Pool Split"]].map(([v,l])=>(
          <div key={l} style={{background:C.gold,borderRadius:28,padding:"9px 18px",textAlign:"center",minWidth:120}}>
            <div style={{fontSize:13,fontWeight:900,color:C.navy}}>{v}</div>
            <div style={{fontSize:10,fontWeight:700,color:C.navy,opacity:.75,textTransform:"uppercase",letterSpacing:.4}}>{l}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="section" style={{background:C.white}}>
        <div className="section-inner" style={{textAlign:"center"}}>
          <span className="section-tag" style={{background:"#EFF6FF",color:C.blue}}>The Contribution Cell</span>
          <h2 className="section-title">How CoFundBills Works</h2>
          <p className="section-sub" style={{margin:"0 auto 28px"}}>Members join contribution cells of 10 to 14 members. Ten contributing members pay monthly and share a payout at cycle end. Network position holders earn credit points that unlock better loan access.</p>
          <div className="grid-3" style={{marginBottom:24}}>
            {[
              {icon:"💳",title:"Contributing Members (10)",desc:`Each pays ₦10,000/month for 10 months. Receives ₦50,000 cash at cycle end plus credit points. Total contributed: ₦100,000.`,color:C.blue},
              {icon:"🔗",title:"Host · Anchor · Root",desc:"Three network positions for existing active members whose invite chain led to this cell. Earn credit points only — no cash from contributions.",color:C.green},
              {icon:"🎖️",title:"Founding Member",desc:"Seats in the Root/Founding position in cells traceable to their network. Contributes ₦10,000/month like all members. Earns credit points in every traceable cell simultaneously — boosting their credit score and loan access faster.",color:C.burg},
            ].map(c=>(
              <div key={c.title} className="card" style={{borderTop:`3px solid ${c.color}`,textAlign:"left"}}>
                <div style={{fontSize:26,marginBottom:8}}>{c.icon}</div>
                <div style={{fontWeight:800,color:c.color,fontSize:13,marginBottom:6}}>{c.title}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{c.desc}</div>
              </div>
            ))}
          </div>

          {/* Split breakdown */}
          <div className="card" style={{textAlign:"left",marginBottom:20}}>
            <div style={{fontWeight:800,color:C.navy,fontSize:14,marginBottom:14}}>Every ₦10,000 Contribution — Split 5 Ways</div>
            <div className="grid-4" style={{gap:10}}>
              {[
                {l:"Member Benefit Pool",a:"₦5,000",p:"50%",c:C.blue},
                {l:"Bill Support Fund",a:"₦2,500",p:"25%",c:C.green},
                {l:"Loan Fund",a:"₦1,000",p:"10%",c:C.purple},
                {l:"Administration",a:"₦1,000",p:"10%",c:C.amber},
                {l:"Contingency Reserve",a:"₦1,000",p:"10%",c:C.burg},
              ].map(s=>(
                <div key={s.l} style={{background:C.bg,borderRadius:10,padding:12,borderLeft:`3px solid ${s.c}`}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.c}}>{s.a} <span style={{fontSize:11}}>{s.p}</span></div>
                  <div style={{fontSize:11,fontWeight:700,color:C.navy,marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle payout */}
          <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,borderRadius:14,padding:22,color:C.white,marginBottom:8}}>
            <div style={{fontWeight:900,fontSize:17,marginBottom:8}}>Cycle Payout — What Every Contributing Member Receives</div>
            <div style={{opacity:.85,fontSize:14,lineHeight:1.8,marginBottom:12}}>
              ₦5,000 × 10 months × 10 members = <strong style={{color:C.gold}}>₦500,000 total benefit pool</strong><br/>
              Divided equally → <strong style={{color:C.gold}}>₦50,000 per contributing member</strong> at cycle end
            </div>
            <div style={{fontSize:11,opacity:.65,lineHeight:1.7}}>
              * Each contributing member contributed ₦100,000 over 10 months. They receive ₦50,000 cash. The ₦50,000 difference funds cooperative services — 25% to bill support, 10% to loans, 10% to administration and 5% to contingency reserve — all available to active members.
            </div>
          </div>
        </div>
      </div>

      {/* Cell Merger */}
      <div className="section" style={{background:C.bg}}>
        <div className="section-inner">
          <span className="section-tag" style={{background:"#FEF3C7",color:C.amber}}>Cell Formation & Merger</span>
          <h2 className="section-title">No Member is Left Behind</h2>
          <p className="section-sub">Cells form automatically when 10 active contributing members are available. If a forming cell does not fill within 30 days, the cooperative's merger mechanism ensures all members find a cell without unnecessary delay.</p>
          <div className="grid-2">
            {[
              {icon:"⚡",title:"Automatic Cell Formation",desc:"As soon as 10 unplaced active members are available, a new contribution cell forms automatically — no admin intervention needed.",color:C.blue},
              {icon:"🔀",title:"30-Day Merger Rule",desc:"Forming cells over 30 days old without 10 contributors are merged. The more populated cell absorbs the less populated, adopting its network positions.",color:C.amber},
              {icon:"🏆",title:"Priority for Waiting Members",desc:"Members who miss a merger seat return to a priority queue and are placed first in the next available merger.",color:C.green},
              {icon:"🛡️",title:"Network Positions Preserved",desc:"Original network positions are suspended — not lost — during a merger. If a cell ever completes independently, original positions are fully restored.",color:C.burg},
            ].map(c=>(
              <div key={c.title} className="card" style={{borderLeft:`3px solid ${c.color}`}}>
                <div style={{fontSize:22,marginBottom:6}}>{c.icon}</div>
                <div style={{fontWeight:800,color:c.color,fontSize:13,marginBottom:6}}>{c.title}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Credit Score */}
      <div className="section" style={{background:C.white}}>
        <div className="section-inner">
          <span className="section-tag" style={{background:C.gold+"33",color:C.gold}}>CoFund Credit Score</span>
          <h2 className="section-title">Your Behaviour Builds Your Credit</h2>
          <p className="section-sub">Your CoFund Credit Score is earned through disciplined participation — not through who you recruit. Better behaviour means better loan rates and higher loan limits.</p>
          <div className="grid-2">
            <div className="card">
              <div style={{fontWeight:800,color:C.navy,marginBottom:12,fontSize:13}}>How You Earn Points</div>
              {[
                ["Monthly contribution on time","+20 pts","Contributing Members only"],
                ["Each month your cell is active","+5 pts","All seat types equally"],
                ["Cycle completed","+100/50/30/20/10 pts","Contributing/Host/Anchor/Root-Founding/Admin (see portal for full breakdown)"],
                ["Loan repaid on time","+50 pts","All members"],
                ["Missed contribution","−30 pts","Contributing Members"],
                ["Loan default","−100 pts","All members"],
              ].map(([e,p,w])=>(
                <div key={e} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.bg}`,fontSize:12}}>
                  <div><div style={{color:C.navy,fontWeight:600}}>{e}</div><div style={{fontSize:10,color:C.muted}}>{w}</div></div>
                  <span style={{fontWeight:900,color:p.startsWith("+")?"#166534":C.error,fontSize:13,marginLeft:8,flexShrink:0}}>{p}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontWeight:800,color:C.navy,marginBottom:12,fontSize:13}}>Credit Score → Loan Access</div>
              {[
                {l:"Excellent",r:"1,000+",rate:"1%/month",limit:"₦600,000",c:C.green},
                {l:"Strong",r:"700–999",rate:"2%/month",limit:"₦360,000",c:C.blue},
                {l:"Standard",r:"500–699",rate:"3%/month",limit:"₦180,000",c:C.amber},
                {l:"Higher-Risk",r:"Below 500",rate:"4%/month",limit:"₦60,000",c:C.error},
              ].map(c=>(
                <div key={c.l} style={{borderRadius:10,border:`1.5px solid ${c.c}33`,padding:11,marginBottom:8,background:c.c+"11"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><span style={{fontWeight:800,color:c.c,fontSize:12}}>{c.l}</span><span style={{fontSize:10,color:C.muted,marginLeft:6}}>{c.r}</span></div>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:C.navy,fontSize:12}}>{c.rate}</div><div style={{fontSize:10,color:C.muted}}>Max: {c.mult} × ₦10,000</div></div>
                  </div>
                </div>
              ))}
              <div style={{fontSize:11,color:C.muted,marginTop:6,lineHeight:1.6}}>Loan approval subject to fund liquidity, repayment capacity and cooperative credit policy.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Not a pyramid */}
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"48px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
          <div style={{color:C.gold,fontWeight:900,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Legally Structured · Cooperative Society</div>
          <h2 style={{color:C.white,fontSize:22,fontWeight:900,marginBottom:20}}>Why CoFundBills is NOT a Pyramid Scheme</h2>
          <div className="grid-2" style={{textAlign:"left",gap:12}}>
            {[
              ["✅ No cash from recruiting","Host, Anchor and Root earn credit points only — never cash from contributors below them."],
              ["✅ Real cooperative services","Contribution cells, bill support fund, credit scoring and loan facility are genuine cooperative services."],
              ["✅ Works without new members","Existing active members complete cycles, access loans and build credit indefinitely without new recruitment."],
              ["✅ Registered cooperative","Being registered as a Multi-Purpose Cooperative Society under Lagos State Cooperative Societies Law 2022."],
              ["✅ Every naira documented","50% benefit pool, 25% bill support, 10% loans, 10% admin, 5% reserve — transparent and automatic."],
              ["✅ Behaviour-based credit","Loan access is earned through contribution discipline and repayment history — not through recruiting others."],
            ].map(([t,d])=>(
              <div key={t} style={{background:"rgba(255,255,255,.08)",borderRadius:10,padding:13}}>
                <div style={{color:C.gold,fontWeight:800,fontSize:12,marginBottom:4}}>{t}</div>
                <div style={{color:"rgba(255,255,255,.7)",fontSize:12,lineHeight:1.6}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bill Support */}
      <div className="section" style={{background:C.white}}>
        <div className="section-inner" style={{textAlign:"center"}}>
          <span className="section-tag" style={{background:"#F0FDF4",color:C.green}}>Essential Bill Support</span>
          <h2 className="section-title">Collective Bill Financing</h2>
          <p className="section-sub" style={{margin:"0 auto 24px"}}>25% of every contribution funds the cooperative Bill Support Fund. Active members can apply for support for approved essential bills.</p>
          <div className="grid-3">
            {[["🏠","House Rent"],["🎓","School Fees"],["🏥","Medical Bills"],["💡","Electricity"],["💧","Water Bills"],["🛒","Household Essentials"]].map(([i,l])=>(
              <div key={l} className="card" style={{textAlign:"center",padding:14}}>
                <div style={{fontSize:26,marginBottom:5}}>{i}</div>
                <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{background:C.bg,padding:"52px 24px",textAlign:"center"}}>
        <h2 style={{fontSize:22,fontWeight:900,color:C.navy,marginBottom:8}}>Ready to Co-Fund Your Bills?</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.8,maxWidth:460,margin:"0 auto 24px"}}>Join free today. Contribute ₦10,000 monthly, build your CoFund Credit Score, and access cooperative bill financing and loans.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-gold btn-lg" onClick={()=>setModal({type:"register"})}>Join CoFundBills Free</button>
          <a className="wa-btn" href="https://wa.me/2348061631222?text=Hello%2C%20I%20have%20a%20question%20about%20CoFundBills" target="_blank" rel="noopener noreferrer">💬 Chat with Admin on WhatsApp</a>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div style={{fontWeight:900,color:C.white,fontSize:15,marginBottom:3}}>CoFundBills Cooperative</div>
        <div style={{color:C.gold,fontStyle:"italic",marginBottom:10}}>"Don't face bills alone. Let's co-fund them."</div>
        <div>2B, Olawale Cole, Onitiri Avenue, Lekki Phase 1, Lagos, Nigeria.</div>
        <div>cofundbills@gmail.com · +234 806 163 1222 · +234 909 999 4816</div>
        <div style={{marginTop:10,fontSize:11,opacity:.55}}>© 2026 CoFundBills Cooperative. All rights reserved. CoFundBills is a cooperative society — not an insurance company, financial institution or investment scheme. Contributions and loan approvals are subject to cooperative rules, fund liquidity and applicable Nigerian law.</div>
        <div style={{marginTop:8,fontSize:12}}>
          <span style={{cursor:"pointer",color:C.gold}} onClick={()=>setTcOpen(true)}>Terms & Conditions</span>
          {" · "}
          <span style={{cursor:"pointer",color:C.gold}} onClick={()=>setFaqOpen(true)}>FAQs</span>
        </div>
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════════
  // ── Member Portal ─────────────────────────────────────────────
  const Portal = () => {
    if(!member) return null;
    const m = member;
    const cat = scoreCategory(m.creditScore);
    const myCells = cells.filter(c=>(c.seats||[]).some(s=>s.link_code===m.linkCode));
    const myLoans = loans.filter(l=>l.link_code===m.linkCode);

    return(
      <div style={{background:C.bg,minHeight:"100vh"}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"22px 24px",marginBottom:0}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{color:C.gold,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Member Portal</div>
              <div style={{fontWeight:900,fontSize:19,color:C.white}}>{m.fullName}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:2}}>{m.linkCode} · {m.memberType==="founding"?"Founding Member":"Regular Member"}</div>
              <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
                <span className="pill" style={{background:m.status==="active"?"#BBF7D0":"#FEF3C7",color:m.status==="active"?"#166534":"#92400E"}}>
                  {m.status==="active"?"✅ Active":"⏳ Pending Activation"}
                </span>
                <span className="pill" style={{background:cat.color+"33",color:cat.color,border:`1px solid ${cat.color}55`}}>
                  {cat.label} · {m.creditScore} pts
                </span>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={()=>{setMember(null);setView("landing");}}>🔒 Log Out</button>
          </div>
        </div>

        <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px"}}>
          <div className="portal-tabs">
            {[["dashboard","🏠 Dashboard"],["cells","My Cell"],["credit","Credit Score"],["loan","Co-Fund Loan"],["bills","Bill Support"],["statement","Statement"]].map(([id,lbl])=>(
              <button key={id} className={`portal-tab${portalTab===id?" active":""}`}
                style={portalTab===id?{background:C.blue,borderColor:C.blue,color:C.white}:{}}
                onClick={()=>setPortalTab(id)}>{lbl}</button>
            ))}
          </div>

          {/* Dashboard */}
          {portalTab==="dashboard"&&(
            <div>
              <div className="grid-3" style={{marginBottom:16}}>
                {[
                  {l:"Contribution Balance",v:fmtNGN(m.contributionBalance),c:C.blue},
                  {l:"Bill Support Balance",v:fmtNGN(m.billSupportBalance),c:C.green},
                  {l:"Loan Balance",v:fmtNGN(m.loanBalance),c:m.loanBalance>0?C.error:C.muted},
                  {l:"Credit Score",v:fmtPts(m.creditScore),c:cat.color},
                  {l:"Cycles Completed",v:m.cyclesCompleted,c:C.navy},
                  {l:"Months Contributed",v:m.monthsContributed,c:C.navy},
                ].map(s=>(
                  <div key={s.l} className="stat-card" style={{borderTop:`3px solid ${s.c}`}}>
                    <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3,textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div>
                  </div>
                ))}
              </div>
              {m.status==="pending"&&(
                <div className="info-box">
                  <strong>🔔 Activate Your Membership</strong><br/>
                  Pay your first monthly contribution of ₦10,000 to activate your membership and enter a contribution cell.
                  <div style={{background:C.white,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:11,marginTop:10,lineHeight:1.9,fontSize:13}}>
                    <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                    Zenith Bank — 1016621205<br/>
                    Reference: <strong>{m.linkCode}</strong><br/>
                    WhatsApp: <strong>+234 909 999 4816</strong>
                  </div>
                </div>
              )}
              <div className="card">
                <div style={{fontWeight:800,color:C.navy,marginBottom:8,fontSize:13}}>Your Co-Fund Invite Link</div>
                <div style={{background:C.bg,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:11,fontFamily:"monospace",fontSize:12,wordBreak:"break-all",marginBottom:8}}>
                  https://cofundbills.vercel.app?ref={m.linkCode}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>{navigator.clipboard.writeText(`https://cofundbills.vercel.app?ref=${m.linkCode}`);showToast("Link copied!");}}>📋 Copy</button>
                <div style={{fontSize:11,color:C.muted,marginTop:8,lineHeight:1.7}}>
                  Share your invite link to help grow the cooperative. Members you introduce may seat you as Host, Anchor or Root/Founding in their contribution cell — earning you CoFund Credit Score points that improve your loan access.
                </div>
              </div>
            </div>
          )}

          {/* My Cells */}
          {portalTab==="cells"&&(
            <div>
              {myCells.length===0?(
                <div className="card" style={{textAlign:"center",padding:36,color:C.muted}}>
                  You are not yet placed in a contribution cell. Your cell will form automatically once 10 active members are available, or after a merger.
                </div>
              ):myCells.map(c=>{
                const mySeat = (c.seats||[]).find(s=>s.link_code===m.linkCode);
                const seatInfo = SEAT[mySeat?.seat_type]||SEAT.contributing;
                return(
                  <div key={c.cell_code}>
                    <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                      <span style={{background:seatInfo.bg,color:C.white,borderRadius:20,padding:"3px 10px",fontWeight:700}}>{seatInfo.icon} {seatInfo.label}</span>
                      {mySeat?.seat_type==="contributing"&&<span style={{color:C.muted}}>Payout at cycle end: <strong>₦50,000 cash + 250 credit pts</strong></span>}
                      {mySeat?.seat_type!=="contributing"&&<span style={{color:C.muted}}>Earning credit points in this cell</span>}
                    </div>
                    <CellVisual cell={c}/>
                  </div>
                );
              })}
            </div>
          )}

          {/* Credit Score */}
          {portalTab==="credit"&&(
            <div>
              <div className="card" style={{textAlign:"center",padding:"24px",marginBottom:14}}>
                <div style={{fontSize:52,fontWeight:900,color:cat.color}}>{m.creditScore}</div>
                <div style={{fontSize:15,fontWeight:700,color:cat.color,marginTop:3}}>{cat.label}</div>
                <div className="score-bar" style={{maxWidth:280,margin:"10px auto 0"}}>
                  <div className="score-fill" style={{width:Math.min(m.creditScore/10,100)+"%",background:cat.color}}/>
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:8}}>Loan rate: <strong>{cat.rate}%/month</strong> · Max loan: <strong>{fmtNGN(cat.limit)}</strong></div>
              </div>
              <div className="card">
                <div style={{fontWeight:800,color:C.navy,marginBottom:10,fontSize:13}}>How to Improve Your Score</div>
                {[
                  ["Contribute on time every month","+10 pts"],
                  ["Stay active in your contribution cell","Up to +5 pts/month"],
                  ["Complete a full 10-month cycle","+100 pts"],
                  ["Repay loans on time","+50 pts per repayment"],
                  ["Invite members who form new cells","Credit pts as Host/Anchor/Root"],
                ].map(([a,b])=>(
                  <div key={a} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.bg}`,fontSize:12}}>
                    <span style={{color:C.navy}}>{a}</span>
                    <span style={{fontWeight:700,color:C.green,flexShrink:0,marginLeft:8}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan */}
          {portalTab==="loan"&&(
            <div>
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,marginBottom:4,fontSize:13}}>Your Loan Eligibility</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Based on your CoFund Credit Score of {m.creditScore} pts ({cat.label})</div>
                <div className="grid-3" style={{marginBottom:12}}>
                  {[{l:"Category",v:cat.label,c:cat.color},{l:"Interest Rate",v:`${cat.rate}%/month`,c:C.navy},{l:"Maximum Loan",v:fmtNGN(cat.limit),c:C.green}].map(s=>(
                    <div key={s.l} className="stat-card"><div style={{fontSize:15,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:C.muted,marginTop:3,textTransform:"uppercase"}}>{s.l}</div></div>
                  ))}
                </div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Loan approval is subject to available fund liquidity, repayment capacity and cooperative credit policy.</div>
              </div>
              {m.loanBalance>0?(
                <div className="warn-box">Outstanding loan: {fmtNGN(m.loanBalance)}. Please repay before applying for a new loan. Contact admin on +234 909 999 4816.</div>
              ):(
                <div className="card">
                  <div style={{fontWeight:800,color:C.navy,marginBottom:14,fontSize:13}}>Apply for a Co-Fund Loan</div>
                  <div className="field"><label>Bill Type / Purpose</label>
                    <select value={loanForm.billType} onChange={e=>setLoanForm({...loanForm,billType:e.target.value,purpose:e.target.value})}>
                      <option value="">Select purpose</option>
                      {["House Rent","School Fees","Medical Bills","Electricity","Water Bills","Household Essentials","Other"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  {loanForm.billType==="Other"&&<div className="field"><label>Describe Purpose</label><input type="text" value={loanForm.purpose} onChange={e=>setLoanForm({...loanForm,purpose:e.target.value})}/></div>}
                  <div className="field"><label>Loan Amount (Max: {fmtNGN(cat.limit)})</label>
                    <input type="number" placeholder="Enter amount" value={loanForm.amount} onChange={e=>setLoanForm({...loanForm,amount:e.target.value})}/>
                  </div>
                  {loanForm.amount&&<div style={{background:C.bg,borderRadius:8,padding:10,fontSize:12,color:C.muted,marginBottom:12}}>
                    Estimated total repayable: <strong style={{color:C.navy}}>{fmtNGN(Number(loanForm.amount)*(1+cat.rate/100*3))}</strong> over 3 months at {cat.rate}%/month
                  </div>}
                  <button className="btn btn-blue" onClick={handleLoanApply}>Submit Loan Application</button>
                </div>
              )}
              {myLoans.length>0&&(
                <div className="card" style={{marginTop:14}}>
                  <div style={{fontWeight:800,color:C.navy,marginBottom:10,fontSize:13}}>Your Loan History</div>
                  {myLoans.map(l=>(
                    <div key={l.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.bg}`,fontSize:12}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontWeight:700}}>{fmtNGN(l.amount)} — {l.bill_type}</span>
                        <span className="pill" style={{background:l.status==="approved"?"#BBF7D0":l.status==="pending"?"#FEF3C7":"#FEE2E2",color:l.status==="approved"?"#166534":l.status==="pending"?"#92400E":C.error,fontSize:10}}>{l.status}</span>
                      </div>
                      <div style={{color:C.muted,marginTop:2}}>{l.credit_category} · {l.interest_rate}%/month · Total: {fmtNGN(l.total_repayable)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bill Support */}
          {portalTab==="bills"&&(()=>{
            const billFund = funds.bill_support||0;
            const tierCap = getBillCap(billFund);
            const isEligible = m.creditScore >= BILL_SCORE_MIN;
            const fundPct = Math.min(Math.round(billFund/10000000*100),100);

            return(
            <div>
              {/* Fund indicator card */}
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:12}}>Bill Support Fund Status</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <div className="stat-card" style={{borderTop:`3px solid ${tierCap.color}`}}>
                    <div style={{fontSize:16,fontWeight:900,color:tierCap.color}}>{fmtNGN(billFund)}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3,textTransform:"uppercase"}}>Current Fund Balance</div>
                  </div>
                  <div className="stat-card" style={{borderTop:`3px solid ${tierCap.color}`}}>
                    <div style={{fontSize:16,fontWeight:900,color:tierCap.color}}>{tierCap.label}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3,textTransform:"uppercase"}}>Your Claim Limit</div>
                  </div>
                </div>

                {/* Tier progress bar */}
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}>
                    <span>Fund tier: <strong style={{color:tierCap.color}}>{tierCap.tier}</strong></span>
                    <span>{fmtNGN(billFund)} of {fmtNGN(10000000)} (Platinum)</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{width:fundPct+"%",background:tierCap.color}}/>
                  </div>
                </div>

                {/* Tier ladder */}
                <div style={{fontSize:11,color:C.muted,lineHeight:1.9}}>
                  {[
                    {min:"₦10,000,000+",cap:"₦500,000",tier:"Platinum",c:"#0B6E4F"},
                    {min:"₦5,000,000+", cap:"₦350,000",tier:"Gold",    c:"#C9A84C"},
                    {min:"₦2,000,000+", cap:"₦250,000",tier:"Silver",  c:"#6B7280"},
                    {min:"Below ₦2M",   cap:"₦100,000",tier:"Bronze",  c:"#B45309"},
                  ].map(t=>(
                    <div key={t.tier} style={{display:"flex",justifyContent:"space-between",
                      padding:"3px 8px",borderRadius:6,
                      background:t.tier===tierCap.tier?t.c+"18":"transparent",
                      border:t.tier===tierCap.tier?`1px solid ${t.c}44`:"1px solid transparent"}}>
                      <span style={{color:t.tier===tierCap.tier?t.c:C.muted,fontWeight:t.tier===tierCap.tier?700:400}}>
                        {t.tier===tierCap.tier?"▶ ":""}{t.tier} — Fund {t.min}
                      </span>
                      <span style={{color:t.tier===tierCap.tier?t.c:C.muted,fontWeight:t.tier===tierCap.tier?700:400}}>
                        Max {t.cap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility status */}
              <div className={isEligible?"success-box":"warn-box"} style={{marginBottom:14}}>
                {isEligible?(
                  <>
                    <strong>✅ You are eligible to apply for bill support.</strong><br/>
                    Your credit score: <strong>{m.creditScore} pts</strong> — Excellent category.<br/>
                    Note: A successful claim deducts <strong>500 credit points</strong> from your score. You will need to rebuild to 1,000+ before your next claim.
                  </>
                ):(
                  <>
                    <strong>🔒 Bill support is not yet accessible.</strong><br/>
                    Required credit score: <strong>1,000 pts (Excellent)</strong><br/>
                    Your current score: <strong>{m.creditScore} pts</strong> — {scoreCategory(m.creditScore).label}<br/>
                    You need <strong>{Math.max(0,1000-m.creditScore)} more points</strong> to qualify.
                    <div style={{marginTop:8,fontSize:11,color:C.muted}}>
                      Build your score through consistent contributions, completing cycles and holding network seats (Host, Anchor, Root/Founding).
                    </div>
                  </>
                )}
              </div>

              {/* Application form — only if eligible */}
              {isEligible&&(
                <div className="card">
                  <div style={{fontWeight:800,color:C.navy,marginBottom:14,fontSize:13}}>Apply for Bill Support</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.7,background:C.bg,borderRadius:8,padding:10}}>
                    Maximum claim: <strong style={{color:tierCap.color}}>{tierCap.label}</strong> ({tierCap.tier} tier)<br/>
                    This limit reflects the current cooperative fund balance and will increase as the fund grows.
                  </div>
                  <div className="field"><label>Bill Type</label>
                    <select value={billForm.billType} onChange={e=>setBillForm({...billForm,billType:e.target.value})}>
                      <option value="">Select bill type</option>
                      {["House Rent","School Fees","Medical Bills","Electricity","Water Bills","Household Essentials"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Amount Requested (Max: {tierCap.label})</label>
                    <input type="number" placeholder={`Up to ${tierCap.label}`} value={billForm.amount}
                      onChange={e=>setBillForm({...billForm,amount:e.target.value})}/>
                  </div>
                  <div className="field"><label>Description / Bill Details</label>
                    <textarea rows={3} style={{resize:"none"}} value={billForm.description}
                      onChange={e=>setBillForm({...billForm,description:e.target.value})}
                      placeholder="e.g. Annual house rent for 2026, landlord details, school name and term etc."/>
                  </div>
                  <button className="btn btn-green" onClick={handleBillApply}>Submit Application</button>
                </div>
              )}
            </div>
            );
          })()}

          {/* Statement */}
          {portalTab==="statement"&&(
            <div className="card">
              <div style={{fontWeight:800,color:C.navy,marginBottom:14,fontSize:13}}>Account Summary</div>
              {[
                ["Contribution Balance",fmtNGN(m.contributionBalance)],
                ["Bill Support Balance",fmtNGN(m.billSupportBalance)],
                ["Loan Balance",fmtNGN(m.loanBalance)],
                ["Credit Score",fmtPts(m.creditScore)],
                ["Cycles Completed",m.cyclesCompleted],
                ["Months Contributed",m.monthsContributed],
                ["Member Since",m.joinedAt?new Date(m.joinedAt).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}):"—"],
                ["Activated",m.activatedAt?new Date(m.activatedAt).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"}):"Pending"],
              ].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.bg}`,fontSize:13}}>
                  <span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:C.navy}}>{v}</span>
                </div>
              ))}
              <div style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:12}}>For full transaction history contact cofundbills@gmail.com or WhatsApp +234 909 999 4816</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ── Admin Dashboard ───────────────────────────────────────────
  const Admin = () => {
    const allArr = Object.values(members);
    const activeArr = allArr.filter(m=>m.status==="active");
    const pendingArr = allArr.filter(m=>m.status==="pending");
    const foundingArr = allArr.filter(m=>m.memberType==="founding");
    const activeCells = cells.filter(c=>c.status==="active");
    const formingCells = cells.filter(c=>c.status==="forming");
    const completedCells = cells.filter(c=>c.status==="completed");
    const pendingLoans = loans.filter(l=>l.status==="pending");
    const pendingBills = billApps.filter(b=>b.status==="pending");

    return(
      <div style={{background:C.bg,minHeight:"100vh"}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:C.gold,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>Admin Dashboard</div>
            <div style={{color:C.white,fontWeight:900,fontSize:17,marginTop:2}}>CoFundBills Cooperative</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-outline btn-sm" onClick={async()=>{const allM=await loadMembers();const allC=await loadCells();await runMergerCheck(allM,allC);}}>🔀 Run Merger Check</button>
            <button className="btn btn-outline btn-sm" onClick={()=>setView("landing")}>🏠 Home</button>
          </div>
        </div>

        <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px"}}>
          {/* Stats */}
          <div className="grid-4" style={{marginBottom:18}}>
            {[
              ["Total Members",allArr.length],["Active",activeArr.length],
              ["Pending",pendingArr.length],["Founding",foundingArr.length+"/25"],
              ["Forming Cells",formingCells.length],["Active Cells",activeCells.length],
              ["Completed Cells",completedCells.length],["Pending Loans",pendingLoans.length],
              ["Pending Bills",pendingBills.length],["Bill Support Fund",fmtNGN(funds.bill_support||0)],
              ["Loan Fund",fmtNGN(funds.loan_fund||0)],["Reserve",fmtNGN(funds.contingency||0)],
            ].map(([l,v])=>(
              <div key={l} className="stat-card"><div className="stat-val" style={{fontSize:16}}>{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>

          {/* Tabs */}
          <div className="portal-tabs" style={{marginBottom:18}}>
            {[["members","Members"],["pending","Pending"],["cells","Cells"],["loans","Loans"],["bills","Bill Support"],["analytics","📊 Analytics"]].map(([id,lbl])=>(
              <button key={id} className={`portal-tab${adminTab===id?" active":""}`}
                style={adminTab===id?{background:C.navy,borderColor:C.navy,color:C.white}:{}}
                onClick={async()=>{
                  setAdminTab(id);
                  if(id==="analytics"){const {data}=await supabase.from("cfb_visitors").select("*").order("visited_at",{ascending:false}).limit(500);setAnalytics(data||[]);}
                  if(id==="loans") await loadLoans();
                  if(id==="bills") await loadBillApps();
                }}>{lbl}</button>
            ))}
          </div>

          {/* Members */}
          {adminTab==="members"&&(
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 60px",gap:10}}>
                <span>Member</span><span>Type</span><span>Credit</span><span>Cycles</span><span>Status</span><span></span>
              </div>
              {allArr.map(m=>(
                <div key={m.linkCode} className="table-row" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 60px",gap:10,alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{m.fullName}</div><div style={{fontSize:11,color:C.muted}}>{m.email}</div><div style={{fontSize:10,color:C.blue,fontFamily:"monospace"}}>{m.linkCode}</div></div>
                  <span className="pill" style={{background:m.memberType==="admin"?C.green:m.memberType==="founding"?C.burg:C.blue,color:C.white,fontSize:10}}>{m.memberType==="admin"?"Admin":m.memberType==="founding"?"Founding":"Regular"}</span>
                  <span style={{fontWeight:700,color:scoreCategory(m.creditScore).color,fontSize:12}}>{m.creditScore} pts</span>
                  <span style={{fontSize:12}}>{m.cyclesCompleted}</span>
                  <span className="pill" style={{background:m.status==="active"?"#BBF7D0":m.status==="pending"?"#FEF3C7":"#FEE2E2",color:m.status==="active"?"#166534":m.status==="pending"?"#92400E":C.error,fontSize:10}}>{m.status}</span>
                  <button className="btn-danger" onClick={async()=>{if(confirm(`Delete ${m.fullName}?`)){await supabase.from("cfb_members").delete().eq("link_code",m.linkCode);await loadMembers();}}}>🗑</button>
                </div>
              ))}
            </div>
          )}

          {/* Pending */}
          {adminTab==="pending"&&(
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 180px",gap:10}}>
                <span>Member</span><span>Phone</span><span>State</span><span>Ref</span><span>Actions</span>
              </div>
              {pendingArr.length===0?<div style={{padding:28,textAlign:"center",color:C.muted}}>No pending activations.</div>:
              pendingArr.map(m=>(
                <div key={m.linkCode} className="table-row" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 180px",gap:10,alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{m.fullName}</div><div style={{fontSize:11,color:C.muted}}>{m.email}</div><div style={{fontSize:10,color:C.blue,fontFamily:"monospace"}}>{m.linkCode}</div></div>
                  <div style={{fontSize:12}}>{m.phone}</div>
                  <div style={{fontSize:12}}>{m.state}</div>
                  <div style={{fontSize:11,color:C.muted}}>{m.refCode||"Direct"}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <button className="btn btn-green btn-sm" onClick={()=>handleActivate(m.linkCode)}>✅ Activate</button>
                    <button style={{background:"#FEF3C7",color:"#92400E",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:700}} onClick={()=>handleMakeFounding(m.linkCode)}>🎖️ Make Founding</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cells */}
          {adminTab==="cells"&&(
            <div>
              {cells.length===0?<div className="card" style={{textAlign:"center",padding:36,color:C.muted}}>No cells yet. Cells form automatically when 10 active members are available.</div>:
              cells.map(c=><CellVisual key={c.cell_code} cell={c}/>)}
            </div>
          )}

          {/* Loans */}
          {adminTab==="loans"&&(
            <div>
              <div className="table-wrap">
                <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 120px",gap:10}}>
                  <span>Member</span><span>Amount</span><span>Purpose</span><span>Category</span><span>Status</span><span>Actions</span>
                </div>
                {loans.length===0?<div style={{padding:28,textAlign:"center",color:C.muted}}>No loan applications.</div>:
                loans.map(l=>(
                  <div key={l.id} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 120px",gap:10,alignItems:"center"}}>
                    <div><div style={{fontWeight:700,fontSize:12}}>{members[l.link_code]?.fullName||l.link_code}</div><div style={{fontSize:10,color:C.muted}}>{l.link_code}</div></div>
                    <div style={{fontWeight:700,fontSize:12}}>{fmtNGN(l.amount)}</div>
                    <div style={{fontSize:11,color:C.muted}}>{l.bill_type}</div>
                    <div style={{fontSize:11}}>{l.credit_category} · {l.interest_rate}%</div>
                    <span className="pill" style={{background:l.status==="approved"?"#BBF7D0":l.status==="pending"?"#FEF3C7":"#FEE2E2",color:l.status==="approved"?"#166534":l.status==="pending"?"#92400E":C.error,fontSize:10}}>{l.status}</span>
                    {l.status==="pending"&&(
                      <div style={{display:"flex",gap:4}}>
                        <button className="btn btn-green btn-sm" style={{fontSize:11}} onClick={async()=>{
                          await supabase.from("cfb_loans").update({status:"approved",approved_at:new Date().toISOString()}).eq("id",l.id);
                          await supabase.from("cfb_funds").update({balance:Math.max(0,(funds.loan_fund||0)-Number(l.amount))}).eq("fund_type","loan_fund");
                          await supabase.from("cfb_members").update({loan_balance:(members[l.link_code]?.loanBalance||0)+Number(l.total_repayable)}).eq("link_code",l.link_code);
                          await loadLoans(); await loadFunds(); await loadMembers();
                          showToast("Loan approved.");
                        }}>✅ Approve</button>
                        <button className="btn-danger" style={{fontSize:11}} onClick={async()=>{await supabase.from("cfb_loans").update({status:"rejected"}).eq("id",l.id);await loadLoans();showToast("Loan rejected.");}}>❌</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bill Support */}
          {adminTab==="bills"&&(
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 120px",gap:10}}>
                <span>Member</span><span>Bill Type</span><span>Amount</span><span>Status</span><span>Actions</span>
              </div>
              {billApps.length===0?<div style={{padding:28,textAlign:"center",color:C.muted}}>No bill support applications.</div>:
              billApps.map(b=>(
                <div key={b.id} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 120px",gap:10,alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:12}}>{members[b.link_code]?.fullName||b.link_code}</div><div style={{fontSize:10,color:C.muted}}>{b.link_code}</div></div>
                  <div style={{fontSize:12}}>{b.bill_type}</div>
                  <div style={{fontWeight:700,fontSize:12}}>{fmtNGN(b.amount_requested)}</div>
                  <span className="pill" style={{background:b.status==="approved"?"#BBF7D0":b.status==="pending"?"#FEF3C7":"#FEE2E2",color:b.status==="approved"?"#166534":b.status==="pending"?"#92400E":C.error,fontSize:10}}>{b.status}</span>
                  {b.status==="pending"&&(
                    <div style={{display:"flex",gap:4}}>
                      <button className="btn btn-green btn-sm" style={{fontSize:11}} onClick={async()=>{
                        await supabase.from("cfb_bill_support").update({status:"approved",processed_at:new Date().toISOString()}).eq("id",b.id);
                        await supabase.from("cfb_funds").update({balance:Math.max(0,(funds.bill_support||0)-Number(b.amount_requested))}).eq("fund_type","bill_support");
                        await supabase.from("cfb_members").update({
                          bill_support_balance:(members[b.link_code]?.billSupportBalance||0)+Number(b.amount_requested),
                          credit_score:Math.max(0,(members[b.link_code]?.creditScore||0)-BILL_SCORE_COST),
                        }).eq("link_code",b.link_code);
                        // Log credit deduction
                        await supabase.from("cfb_credit_events").insert({
                          link_code:b.link_code, event_type:"bill_support_claim",
                          points:-BILL_SCORE_COST, description:`Bill support approved: ${fmtNGN(b.amount_requested)} — ${b.bill_type}`,
                        });
                        await loadBillApps(); await loadFunds(); await loadMembers();
                        showToast("Bill support approved. 500 credit points deducted from member.");
                      }}>✅ Approve</button>
                      <button className="btn-danger" style={{fontSize:11}} onClick={async()=>{await supabase.from("cfb_bill_support").update({status:"rejected"}).eq("id",b.id);await loadBillApps();showToast("Rejected.");}}>❌</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Analytics */}
          {adminTab==="analytics"&&(
            <div>
              <div className="grid-4" style={{marginBottom:16}}>
                {[["Total Visits",analytics.length],["Today",analytics.filter(v=>new Date(v.visited_at).toDateString()===new Date().toDateString()).length],["Via Invite",analytics.filter(v=>v.ref_code).length],["Mobile",analytics.filter(v=>v.screen&&Number(v.screen.split("x")[0])<768).length]].map(([l,v])=>(
                  <div key={l} className="stat-card"><div className="stat-val">{v}</div><div className="stat-lbl">{l}</div></div>
                ))}
              </div>
              <div className="table-wrap">
                <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:10}}>
                  <span>Date & Time</span><span>Page</span><span>Via Link</span><span>Device</span>
                </div>
                {analytics.slice(0,100).map((v,i)=>(
                  <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:10,fontSize:12}}>
                    <div style={{color:C.muted}}>{new Date(v.visited_at).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                    <span className="pill" style={{background:"#EFF6FF",color:C.blue,fontSize:10}}>{v.page}</span>
                    <div style={{color:C.blue,fontWeight:600}}>{v.ref_code||"—"}</div>
                    <div style={{color:C.muted}}>{v.screen&&Number(v.screen.split("x")[0])<768?"Mobile":"Desktop"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ── Modals ────────────────────────────────────────────────────
  const renderModal = () => {
    if(!modal) return null;

    const regFields = [
      ["fullName","Full Name","text","Your legal full name"],
      ["email","Email Address","email",""],
      ["phone","Phone Number","tel","08012345678"],
      ["occupation","Occupation","text",""],
      ["address","Residential Address","text",""],
      ["state","State","text",""],
    ];

    if(modal.type==="register") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
        <div className="modal">
          <div className="modal-hdr">
            <div className="modal-title">Join CoFundBills Cooperative</div>
            <div className="modal-sub">Free registration. Activate with ₦10,000 first contribution.</div>
          </div>
          <div className="modal-body">
            {urlRef&&<div className="info-box">🔗 Referred by: <strong>{urlRef}</strong></div>}
            {regErrors.general&&<div className="warn-box">{regErrors.general}</div>}
            <div className="sec-div">Personal Details</div>
            {regFields.map(([k,l,t,p])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} placeholder={p} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
            <div className="field"><label>Country</label>
              <select value={regForm.country} onChange={e=>setRegForm({...regForm,country:e.target.value})}>
                {["Nigeria","Ghana","Kenya","United Kingdom","United States","Canada","Other"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sec-div">Next of Kin</div>
            {[["nokName","Full Name","text",""],["nokPhone","Phone","tel",""],["nokRelationship","Relationship","text","e.g. Spouse, Parent"]].map(([k,l,t,p])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} placeholder={p} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
            <div className="sec-div">Bank Details for Cycle Payout</div>
            {[["bankName","Bank Name","text","e.g. Zenith Bank"],["accountName","Account Name","text","As registered with your bank"],["accountNumber","Account Number","text","10-digit number"]].map(([k,l,t,p])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} placeholder={p} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleRegister} disabled={loading}>{loading?"Registering...":"Complete Registration"}</button>
          </div>
        </div>
      </div>
    );

    if(modal.type==="regSuccess") return(
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-hdr" style={{background:`linear-gradient(135deg,${C.green},#16a34a)`}}>
            <div className="modal-title">✅ Registration Successful!</div>
            <div className="modal-sub">Welcome to CoFundBills Cooperative, {modal.name}.</div>
          </div>
          <div className="modal-body">
            <div className="success-box"><strong>Your Link Code: {modal.linkCode}</strong><br/>Save this — you will use it to log in and share your invite link.</div>
            <div style={{fontWeight:700,color:C.navy,marginBottom:8,fontSize:13}}>Activate Your Membership</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:12}}>Pay ₦10,000 first monthly contribution to activate your membership and enter a contribution cell.</div>
            <div style={{background:C.white,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:12,fontSize:13,lineHeight:1.9}}>
              <strong>Royal Tech Partnership & Investment Limited</strong><br/>
              Zenith Bank — 1016621205<br/>
              Reference: <strong>{modal.linkCode}</strong><br/>
              WhatsApp: <strong>+234 909 999 4816</strong>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn btn-gold" onClick={()=>{setModal(null);setLoginForm({email:"",linkCode:modal.linkCode});setModal({type:"login"});}}>Log In to My Portal</button>
          </div>
        </div>
      </div>
    );

    if(modal.type==="login") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
        <div className="modal">
          <div className="modal-hdr"><div className="modal-title">Log In to Your Portal</div><div className="modal-sub">Enter your email or link code.</div></div>
          <div className="modal-body">
            <div className="field"><label>Email Address</label><input type="email" placeholder="yourname@email.com" value={loginForm.email} onChange={e=>setLoginForm({...loginForm,email:e.target.value})}/></div>
            <div style={{textAlign:"center",color:C.muted,fontSize:12,margin:"4px 0"}}>— OR —</div>
            <div className="field"><label>Link Code</label><input type="text" placeholder="e.g. CFB-AB1234" value={loginForm.linkCode} onChange={e=>setLoginForm({...loginForm,linkCode:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleLogin} disabled={loading}>{loading?"Logging in...":"Log In"}</button>
          </div>
        </div>
      </div>
    );

    if(modal.type==="adminLogin") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
        <div className="modal">
          <div className="modal-hdr"><div className="modal-title">Admin Access</div></div>
          <div className="modal-body">
            <div className="field"><label>Admin Password</label><input type="password" id="apwd" onKeyDown={e=>{if(e.key==="Enter"){if(e.target.value===ADMIN_PASS){setIsAdmin(true);setView("admin");setModal(null);}else showToast("Incorrect password","error");}}}/></div>
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost btn-sm" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn btn-navy" onClick={()=>{const p=document.getElementById("apwd").value;if(p===ADMIN_PASS){setIsAdmin(true);setView("admin");setModal(null);}else showToast("Incorrect password","error");}}>Enter</button>
          </div>
        </div>
      </div>
    );

    return null;
  };

  // ══════════════════════════════════════════════════════════════
  // ── Main Render ───────────────────────────────────────────────
  return(
    <>
      <style>{CSS}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo" onClick={()=>{setMember(null);setView("landing");}}>
          <span>CFB</span>
          <div><div style={{fontSize:12,lineHeight:1}}>CoFundBills</div><div style={{fontSize:9,opacity:.6,fontWeight:400}}>Cooperative</div></div>
        </div>
        <div className="nav-btns">
          <button className="btn btn-outline btn-sm" onClick={()=>setFaqOpen(true)}>FAQs</button>
          <button className="btn btn-outline btn-sm" onClick={()=>setTcOpen(true)}>T&amp;C</button>
          {member?(
            <>
              <button className="btn btn-outline btn-sm" onClick={()=>setView("portal")}>My Portal</button>
              <button className="btn btn-outline btn-sm" onClick={()=>{setMember(null);setView("landing");}}>Log Out</button>
            </>
          ):(
            <>
              <button className="btn btn-outline btn-sm" onClick={()=>setModal({type:"login"})}>Log In</button>
              <button className="btn btn-gold btn-sm" onClick={()=>setModal({type:"register"})}>Join Free</button>
            </>
          )}
          <button style={{background:"transparent",border:"none",color:"rgba(255,255,255,.15)",cursor:"pointer",fontSize:10,padding:"2px 4px"}} onClick={()=>setModal({type:"adminLogin"})}>[ADM]</button>
        </div>
      </nav>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:66,right:14,zIndex:9999,background:toast.type==="error"?C.error:C.green,color:C.white,padding:"11px 18px",borderRadius:10,fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,.2)",maxWidth:300}}>
          {toast.msg}
        </div>
      )}

      {/* Views */}
      {view==="landing"&&<Landing/>}
      {view==="portal"&&<Portal/>}
      {view==="admin"&&<Admin/>}

      {/* Modals */}
      {renderModal()}

      {/* FAQ */}
      {faqOpen&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setFaqOpen(false);}}>
          <div className="modal" style={{maxWidth:680}}>
            <div className="modal-hdr"><div className="modal-title">Frequently Asked Questions</div><div className="modal-sub">CoFundBills Cooperative</div></div>
            <div className="modal-body">
              {FAQS.map(([q,a])=>(
                <details key={q} style={{marginBottom:10,borderBottom:`1px solid ${C.bg}`,paddingBottom:10}}>
                  <summary style={{fontWeight:700,color:C.navy,fontSize:13,cursor:"pointer",padding:"5px 0",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>{q}</span><span style={{color:C.blue,fontSize:18,fontWeight:300,marginLeft:8}}>+</span>
                  </summary>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.8,paddingTop:7,paddingLeft:3}}>{a}</div>
                </details>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost btn-sm" onClick={()=>setFaqOpen(false)}>Close</button>
              <button className="btn btn-gold btn-sm" onClick={()=>{setFaqOpen(false);setModal({type:"register"});}}>Join Free Today</button>
            </div>
          </div>
        </div>
      )}

      {/* T&C */}
      {tcOpen&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setTcOpen(false);}}>
          <div className="modal" style={{maxWidth:680}}>
            <div className="modal-hdr"><div className="modal-title">Terms & Conditions</div><div className="modal-sub">CoFundBills Cooperative — Please read carefully</div></div>
            <div className="modal-body">
              {TCS.map(([t,b])=>(
                <div key={t} style={{marginBottom:18}}>
                  <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:5}}>{t}</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>{b}</div>
                </div>
              ))}
              <div style={{background:C.bg,borderRadius:8,padding:11,fontSize:11,color:C.muted,lineHeight:1.7,marginTop:6}}>
                <strong>Legal Disclaimer:</strong> CoFundBills Cooperative is a cooperative society and is not an insurance company, financial institution, licensed deposit-taking institution or investment scheme. Member contributions and loan approvals are subject to cooperative rules, available fund liquidity and applicable Nigerian law.
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-gold" onClick={()=>setTcOpen(false)}>I Understand</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <div style={{position:"fixed",bottom:90,right:22,zIndex:9998}}>
        {!chatOpen&&(
          <button onClick={()=>setChatOpen(true)} title="CoFundBills Assistant"
            style={{width:58,height:58,borderRadius:"50%",background:`linear-gradient(135deg,${C.navy},${C.blue})`,border:"none",cursor:"pointer",boxShadow:"0 4px 18px rgba(13,33,55,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
            💬
          </button>
        )}
        {chatOpen&&(
          <div style={{width:310,height:440,background:C.white,borderRadius:14,boxShadow:"0 8px 36px rgba(13,33,55,.25)",display:"flex",flexDirection:"column",overflow:"hidden",border:`2px solid ${C.blue}`}}>
            <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:30,height:30,background:C.gold,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🤝</div>
                <div><div style={{color:C.white,fontWeight:800,fontSize:12}}>CoFundBills Assistant</div><div style={{color:"rgba(255,255,255,.6)",fontSize:10}}>Powered by Claude AI</div></div>
              </div>
              <button onClick={()=>setChatOpen(false)} style={{background:"none",border:"none",color:C.white,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:7}}>
              {chatMsgs.map((msg,i)=>(
                <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"86%",padding:"7px 11px",borderRadius:9,fontSize:12,lineHeight:1.6,background:msg.role==="user"?C.blue:"#EFF6FF",color:msg.role==="user"?C.white:C.dark}}>{msg.content}</div>
                </div>
              ))}
              {chatLoading&&<div style={{background:"#EFF6FF",padding:"7px 11px",borderRadius:9,fontSize:12,color:C.muted,alignSelf:"flex-start"}}>Thinking...</div>}
            </div>
            <div style={{padding:"7px 9px",borderTop:`1px solid ${C.bg}`,flexShrink:0}}>
              <textarea rows={2} placeholder="Ask about CoFundBills..." value={chatInput} onChange={e=>setChatInput(e.target.value)}
                style={{width:"100%",padding:"7px",border:`1.5px solid ${C.bg}`,borderRadius:7,fontSize:12,fontFamily:"inherit",outline:"none",color:C.dark,background:C.white,resize:"none",boxSizing:"border-box",display:"block"}}/>
              <button onClick={()=>{if(!chatInput.trim()||chatLoading)return;handleChat();}}
                style={{marginTop:5,width:"100%",padding:"7px",background:C.blue,color:C.white,border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {chatLoading?"Thinking...":"Send Message"}
              </button>
            </div>
            <div style={{padding:"4px 10px 7px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#F8FAFF",borderTop:`1px solid ${C.bg}`,flexShrink:0}}>
              <div style={{fontSize:10,color:C.muted}}>Powered by Claude AI</div>
              <a href="https://wa.me/2348061631222?text=Hello%2C%20I%20have%20a%20question%20about%20CoFundBills" target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",gap:3,background:"#25D366",color:C.white,borderRadius:9,padding:"2px 7px",fontSize:10,fontWeight:700,textDecoration:"none"}}>
                💬 Admin
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
