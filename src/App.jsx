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
// ── Contribution Tiers ───────────────────────────────────────
const TIERS = {
  1: {
    id:1, label:"Tier 1", monthly:10000, benefitPool:5000, billSupport:2500,
    loanFund:1250, admin:750, contingency:500, cyclePayout:50000,
    unlockScore:400, billScoreMin:1000, excellentScore:1000, strongScore:700, standardScore:500,
    loanLimits:{excellent:600000, strong:360000, standard:180000, minimal:60000},
    billCaps:[{min:0,max:2000000,cap:100000,tier:"Bronze"},{min:2000000,max:5000000,cap:250000,tier:"Silver"},
              {min:5000000,max:10000000,cap:350000,tier:"Gold"},{min:10000000,max:Infinity,cap:500000,tier:"Platinum"}],
    pts:{contribution:20, cellActive:5, cycleContrib:100, cycleNetwork:0,
         loanRepaid:50,
         referralActivation:10, referralCycle:25, billClaim:-500, missed:-30, loanDefault:-100},
    color:"#1A4F8A", name:"₦10,000 / month",
  },
  2: {
    id:2, label:"Tier 2", monthly:50000, benefitPool:25000, billSupport:12500,
    loanFund:6250, admin:3750, contingency:2500, cyclePayout:250000,
    unlockScore:2000, billScoreMin:5000, excellentScore:5000, strongScore:3500, standardScore:2500,
    loanLimits:{excellent:3000000, strong:1800000, standard:900000, minimal:300000},
    billCaps:[{min:0,max:10000000,cap:500000,tier:"Bronze"},{min:10000000,max:25000000,cap:1250000,tier:"Silver"},
              {min:25000000,max:50000000,cap:1750000,tier:"Gold"},{min:50000000,max:Infinity,cap:2500000,tier:"Platinum"}],
    pts:{contribution:100, cellActive:25, cycleContrib:500, cycleNetwork:0,
         loanRepaid:250,
         referralActivation:50, referralCycle:125, billClaim:-2500, missed:-150, loanDefault:-500},
    color:"#0B6E4F", name:"₦50,000 / month",
  },
  3: {
    id:3, label:"Tier 3", monthly:100000, benefitPool:50000, billSupport:25000,
    loanFund:12500, admin:7500, contingency:5000, cyclePayout:500000,
    unlockScore:4000, billScoreMin:10000, excellentScore:10000, strongScore:7000, standardScore:5000,
    loanLimits:{excellent:6000000, strong:3600000, standard:1800000, minimal:600000},
    billCaps:[{min:0,max:20000000,cap:1000000,tier:"Bronze"},{min:20000000,max:50000000,cap:2500000,tier:"Silver"},
              {min:50000000,max:100000000,cap:3500000,tier:"Gold"},{min:100000000,max:Infinity,cap:5000000,tier:"Platinum"}],
    pts:{contribution:200, cellActive:50, cycleContrib:1000, cycleNetwork:0,
         loanRepaid:500,
         referralActivation:100, referralCycle:250, billClaim:-5000, missed:-300, loanDefault:-1000},
    color:"#7C3AED", name:"₦100,000 / month",
  },
  4: {
    id:4, label:"Tier 4", monthly:200000, benefitPool:100000, billSupport:50000,
    loanFund:25000, admin:15000, contingency:10000, cyclePayout:1000000,
    unlockScore:8000, billScoreMin:20000, excellentScore:20000, strongScore:14000, standardScore:10000,
    loanLimits:{excellent:12000000, strong:7200000, standard:3600000, minimal:1200000},
    billCaps:[{min:0,max:40000000,cap:2000000,tier:"Bronze"},{min:40000000,max:100000000,cap:5000000,tier:"Silver"},
              {min:100000000,max:200000000,cap:7000000,tier:"Gold"},{min:200000000,max:Infinity,cap:10000000,tier:"Platinum"}],
    pts:{contribution:400, cellActive:100, cycleContrib:2000, cycleNetwork:0,
         loanRepaid:1000,
         referralActivation:200, referralCycle:500, billClaim:-10000, missed:-600, loanDefault:-2000},
    color:"#B45309", name:"₦200,000 / month",
  },
};

const getTier = (tierNum) => TIERS[tierNum] || TIERS[1];
const getEffectiveTier = (memberTierNum, cellTierNum) => Math.min(memberTierNum||1, cellTierNum||1);

// Legacy constants (Tier 1 defaults)
const MONTHLY_CONTRIB  = 10000;
const BENEFIT_POOL_AMT = 5000;
const BILL_SUPPORT_AMT = 2500;
const LOAN_FUND_AMT    = 1000;
const ADMIN_AMT        = 1000;
const CONTINGENCY_AMT  = 500;
const BILL_SCORE_MIN   = 1000;
const BILL_SCORE_COST  = 500;
const BILL_COOLDOWN    = 10;

// Tiered cap based on fund balance and contribution tier
const getBillCap = (fundBalance, tierNum=1) => {
  const t = getTier(tierNum);
  const caps = t.billCaps;
  for(const c of [...caps].reverse()) {
    if(fundBalance >= c.min) {
      return {cap:c.cap, label:fmtNGN(c.cap), tier:c.tier, color:
        c.tier==="Platinum"?"#0B6E4F":c.tier==="Gold"?"#C9A84C":c.tier==="Silver"?"#6B7280":"#B45309"};
    }
  }
  const first = caps[0];
  return {cap:first.cap, label:fmtNGN(first.cap), tier:first.tier, color:"#B45309"};
};
const CYCLE_MONTHS     = 10;
const BENEFIT_POOL_PCT = 0.60;
const CELL_TIMEOUT_DAYS= 30;

const CREDIT_PTS = {
  contribution:   { contributing:20 },
  cell_active:    { contributing:5 },
  cycle_complete: { contributing:100 },
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
  contributing: { bg:C.blue, light:"#E8F0FA", label:"Contributing Member", icon:"💳" },
};

// ── Helpers ───────────────────────────────────────────────────
const fmtNGN = n => "₦" + Number(n||0).toLocaleString("en-NG");
const fmtPts = n => Number(n||0).toLocaleString() + " pts";
const genCode = pfx => pfx + Math.random().toString(36).substr(2,6).toUpperCase();

// ── Payment schedule helpers ──────────────────────────────────
const getMonthName = (date) => date.toLocaleString("en-NG",{month:"long",year:"numeric"});

const getDeadline = (activationDate, monthNumber) => {
  // Month 1 = activation payment (already paid)
  // Month 2 due = last day of month AFTER activation month
  const d = new Date(activationDate);
  d.setMonth(d.getMonth() + monthNumber); // add monthNumber months
  return new Date(d.getFullYear(), d.getMonth()+1, 0); // last day of that month
};

const getReminderWeekStart = (deadline) => {
  const d = new Date(deadline);
  d.setDate(d.getDate() - 6); // last 7 days of month
  return d;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NG",{
  day:"numeric", month:"long", year:"numeric"
}) : "—";

const isInQueue = (member, cells) => {
  return member.status==="active" && 
    !cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===member.linkCode));
};
const daysSince = dt => dt ? Math.floor((Date.now()-new Date(dt))/(1000*60*60*24)) : 0;

const scoreCategory = (score, tierNum=1, isFounding=false) => {
  const t = getTier(tierNum);
  const rate = isFounding ? 0 : null; // founding members always 0%
  if(score>=t.excellentScore) return {label:"Excellent Performance (Lowest Risk)", rate:rate??1, limit:t.loanLimits.excellent, color:C.green};
  if(score>=t.strongScore)    return {label:"Strong Performance (Low Risk)",       rate:rate??2, limit:t.loanLimits.strong,    color:C.blue};
  if(score>=t.standardScore)  return {label:"Standard Performance (Medium Risk)",  rate:rate??3, limit:t.loanLimits.standard,  color:C.amber};
  return                             {label:"Minimal Performance (Higher-Risk)",   rate:rate??4, limit:t.loanLimits.minimal,   color:C.error};
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
  contributionTier:Number(m.contribution_tier)||1,
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
  const [ajoView,     setAjoView]     = useState("landing"); // landing | create | portal
  const [ajoGroups,   setAjoGroups]   = useState({});
  const [currentAjo,  setCurrentAjo]  = useState(null); // active group code
  const [ajoMembers,  setAjoMembers]  = useState([]);
  const [ajoPayments, setAjoPayments] = useState([]);
  const [ajoForm,     setAjoForm]     = useState({
    groupName:"", coordinatorName:"", coordinatorPhone:"", coordinatorEmail:"",
    memberCount:"", contributionAmount:"", payoutFrequency:"Monthly",
    contributionDay:"", bankName:"", accountName:"", accountNumber:"",
    cycleStartDate:""
  });
  const [ajoJoinForm, setAjoJoinForm] = useState({groupCode:"", name:"", phone:"", email:""});
  const [ajoErrors,   setAjoErrors]   = useState({});
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
  const [regForm,     setRegForm]     = useState({fullName:"",email:"",phone:"",occupation:"",address:"",state:"",country:"Nigeria",nokName:"",nokPhone:"",nokRelationship:"",bankName:"",accountName:"",accountNumber:"",contributionTier:1});
  const [regErrors,   setRegErrors]   = useState({});
  const [loginForm,   setLoginForm]   = useState({email:"",linkCode:""});
  const [loanForm,    setLoanForm]    = useState({amount:"",billType:"",purpose:""});
  const [billForm,    setBillForm]    = useState({billType:"",amount:"",description:""});
  const [tick,        setTick]        = useState(0); // forces countdown re-render
        const [ajoMemberForm, setAjoMemberForm] = useState({name:"", phone:"", email:""});
  const [ajoCode,     setAjoCode]     = useState("");

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

  // Live countdown tick — updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t+1), 60000);
    return () => clearInterval(interval);
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
  // ── Ajo Functions ────────────────────────────────────────────
  const loadAjoGroup = async (groupCode) => {
    const {data:grp} = await supabase.from("cfb_ajo_groups").select("*").eq("group_code",groupCode).single();
    const {data:mems} = await supabase.from("cfb_ajo_members").select("*").eq("group_code",groupCode);
    const {data:pays} = await supabase.from("cfb_ajo_payments").select("*").eq("group_code",groupCode);
    if(grp) setAjoGroups(prev=>({...prev,[groupCode]:grp}));
    setAjoMembers(mems||[]);
    setAjoPayments(pays||[]);
    return grp;
  };

  const handleCreateAjo = async () => {
    const errs = {};
    if(!ajoForm.groupName.trim()) errs.groupName="Group name required";
    if(!ajoForm.coordinatorName.trim()) errs.coordinatorName="Coordinator name required";
    if(!ajoForm.coordinatorPhone.trim()) errs.coordinatorPhone="Phone required";
    if(!ajoForm.coordinatorEmail.trim()) errs.coordinatorEmail="Email required";
    if(!ajoForm.memberCount||isNaN(ajoForm.memberCount)) errs.memberCount="Number of members required";
    if(!ajoForm.contributionAmount||isNaN(ajoForm.contributionAmount)) errs.contributionAmount="Contribution amount required";
    if(!ajoForm.contributionDay||isNaN(ajoForm.contributionDay)) errs.contributionDay="Contribution day required";
    if(!ajoForm.bankName.trim()) errs.bankName="Bank name required";
    if(!ajoForm.accountName.trim()) errs.accountName="Account name required";
    if(!ajoForm.accountNumber.trim()) errs.accountNumber="Account number required";
    if(Object.keys(errs).length){setAjoErrors(errs);return;}
    setAjoErrors({});
    const groupCode = "AJO-"+Math.random().toString(36).substr(2,6).toUpperCase();
    const {error} = await supabase.from("cfb_ajo_groups").insert({
      group_code:groupCode,
      group_name:ajoForm.groupName.trim(),
      coordinator_name:ajoForm.coordinatorName.trim(),
      coordinator_phone:ajoForm.coordinatorPhone.trim(),
      coordinator_email:ajoForm.coordinatorEmail.trim(),
      member_count:Number(ajoForm.memberCount),
      contribution_amount:Number(ajoForm.contributionAmount),
      payout_frequency:ajoForm.payoutFrequency,
      contribution_day:Number(ajoForm.contributionDay),
      bank_name:ajoForm.bankName.trim(),
      account_name:ajoForm.accountName.trim(),
      account_number:ajoForm.accountNumber.trim(),
      cycle_start_date:ajoForm.cycleStartDate||null,
      status:"active",
    });
    if(error){showToast("Error creating group: "+error.message);return;}
    // Add coordinator as first member
    await supabase.from("cfb_ajo_members").insert({
      group_code:groupCode, name:ajoForm.coordinatorName.trim(),
      phone:ajoForm.coordinatorPhone.trim(), email:ajoForm.coordinatorEmail.trim(),
      role:"coordinator", status:"active",
    });
    // Send confirmation email to coordinator
    await sendEmail({
      to_email:ajoForm.coordinatorEmail.trim(), to_name:ajoForm.coordinatorName.trim(),
      subject:`Your Ajo Group is Live on CoFundBills — ${ajoForm.groupName.trim()}`,
      message:`Dear ${ajoForm.coordinatorName.trim()},\n\nYour Ajo group "${ajoForm.groupName.trim()}" has been successfully created on CoFundBills.\n\nGroup Code: ${groupCode}\nMembers: ${ajoForm.memberCount}\nMonthly Contribution: ${fmtNGN(Number(ajoForm.contributionAmount))}\nContribution Day: ${ajoForm.contributionDay}th of every month\nPayout Account: ${ajoForm.bankName.trim()} — ${ajoForm.accountNumber.trim()} (${ajoForm.accountName.trim()})\n\nShare this link with your members to join the group portal:\ncofundbills.vercel.app\n\nGroup Code to share: ${groupCode}\n\nEach member can join, view the contribution schedule, see who has paid, and upload their proof of payment every month.\n\nThis service is completely free of charge from CoFundBills Cooperative.\n\nWarm regards,\nCoFundBills Cooperative\ncofundbills@gmail.com\n+234 909 999 4816`,
    });
    await loadAjoGroup(groupCode);
    setCurrentAjo(groupCode);
    setAjoView("portal");
    showToast(`Group ${groupCode} created successfully!`);
  };

  const handleJoinAjo = async () => {
    const errs = {};
    if(!ajoJoinForm.groupCode.trim()) errs.groupCode="Group code required";
    if(!ajoJoinForm.name.trim()) errs.name="Your name required";
    if(!ajoJoinForm.phone.trim()) errs.phone="Phone required";
    if(Object.keys(errs).length){setAjoErrors(errs);return;}
    setAjoErrors({});
    const code = ajoJoinForm.groupCode.trim().toUpperCase();
    const grp = await loadAjoGroup(code);
    if(!grp){showToast("Group not found. Check your group code.");return;}
    // Check not already a member
    const exists = ajoMembers.find(m=>m.phone===ajoJoinForm.phone.trim());
    if(!exists){
      await supabase.from("cfb_ajo_members").insert({
        group_code:code, name:ajoJoinForm.name.trim(),
        phone:ajoJoinForm.phone.trim(), email:ajoJoinForm.email.trim(),
        role:"member", status:"active",
      });
    }
    await loadAjoGroup(code);
    setCurrentAjo(code);
    setAjoView("portal");
  };

  const handleAjoPayment = async (memberId, monthRef, proofUrl="confirmed") => {
    await supabase.from("cfb_ajo_payments").insert({
      group_code:currentAjo, member_id:memberId,
      month_ref:monthRef, proof_url:proofUrl,
      status:"confirmed", confirmed_at:new Date().toISOString(),
    });
    await loadAjoGroup(currentAjo);
    showToast("Payment recorded.");
  };

  const handleAjoPayout = async (memberId, monthRef) => {
    await supabase.from("cfb_ajo_payments").insert({
      group_code:currentAjo, member_id:memberId,
      month_ref:"PAYOUT-"+monthRef, proof_url:"payout_confirmed",
      status:"payout_confirmed", confirmed_at:new Date().toISOString(),
    });
    await loadAjoGroup(currentAjo);
    showToast("Payout recorded.");
  };

  const sendAjoReminders = async (groupCode) => {
    const grp = ajoGroups[groupCode];
    if(!grp) return;
    const members = ajoMembers.filter(m=>m.group_code===groupCode&&m.email);
    let sent = 0;
    for(const mem of members){
      await sendEmail({
        to_email:mem.email, to_name:mem.name,
        subject:`Ajo Reminder — ${grp.group_name} Contribution Due`,
        message:`Dear ${mem.name},\n\nThis is a reminder that your monthly contribution of ${fmtNGN(grp.contribution_amount)} for the group "${grp.group_name}" is due on the ${grp.contribution_day}th of this month.\n\nPayment Details:\nBank: ${grp.bank_name}\nAccount Name: ${grp.account_name}\nAccount Number: ${grp.account_number}\n\nAfter payment, please upload your proof of payment on the group portal at cofundbills.vercel.app using your Group Code: ${groupCode}\n\nThis reminder is a free service from CoFundBills Cooperative.\nInterested in more structured cooperative savings? Visit cofundbills.vercel.app to learn more.\n\nWarm regards,\nCoFundBills Cooperative`,
      });
      sent++;
    }
    showToast(`Reminders sent to ${sent} members.`);
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
      ref_code:urlRef||null, status:"pending", member_type:"regular", contribution_tier:Number(regForm.contributionTier)||1,
    });
    setLoading(false);
    if(error){ showToast(error.message||"Registration failed","error"); return; }
    const saved = {linkCode, name:regForm.fullName.trim(), tier:Number(regForm.contributionTier)||1};
    // Email to admin
    await sendEmail({
      to_email: ADMIN_EMAIL, to_name: ADMIN_NAME,
      subject: `New CoFundBills Registration — ${regForm.fullName.trim()} (${getTier(Number(regForm.contributionTier)||1).label})`,
      message: `New member registered:\n\nName: ${regForm.fullName.trim()}\nContribution Tier: ${getTier(Number(regForm.contributionTier)||1).label} — ${getTier(Number(regForm.contributionTier)||1).name}\nMonthly Contribution: ${fmtNGN(getTier(Number(regForm.contributionTier)||1).monthly)}\nCycle Payout (10 months): ${fmtNGN(getTier(Number(regForm.contributionTier)||1).cyclePayout)} cash\nBill Support Contribution: ${fmtNGN(getTier(Number(regForm.contributionTier)||1).billSupport)}/month (${fmtNGN(getTier(Number(regForm.contributionTier)||1).billSupport*10)} over cycle)\nEmail: ${regForm.email.trim()}\nPhone: ${regForm.phone.trim()}\nLink Code: ${linkCode}\nOccupation: ${regForm.occupation.trim()}\nAddress: ${regForm.address.trim()}\nState: ${regForm.state.trim()}\nCountry: ${regForm.country}\nNOK: ${regForm.nokName.trim()} (${regForm.nokRelationship.trim()}) — ${regForm.nokPhone.trim()}\nBank: ${regForm.bankName.trim()} | ${regForm.accountName.trim()} | ${regForm.accountNumber.trim()}\nReferred by: ${urlRef||"Direct"}\n\nACTION REQUIRED: Verify payment of NGN10,000 then activate membership in admin dashboard.`,
    });
    // Send welcome email to member
    const mTierData = getTier(Number(regForm.contributionTier)||1);
    const halfOne = fmtNGN(mTierData.benefitPool);
    const halfTwo = fmtNGN(mTierData.monthly - mTierData.benefitPool);
    await sendEmail({
      to_email: regForm.email.trim(), to_name: regForm.fullName.trim(),
      subject: `Welcome to CoFundBills Cooperative — Your Membership Registration is Confirmed`,
      message: `Dear ${regForm.fullName.trim()},\n\nThank you for registering with CoFundBills Cooperative. Your registration has been received and is currently pending activation.\n\nYou registered under the ${mTierData.label} Contribution Group (${fmtNGN(mTierData.monthly)}/month). To activate your membership, please make your first monthly contribution of ${fmtNGN(mTierData.monthly)} to the details below:\n\nAccount Name: Royal Tech Partnership & Investment Limited\nBank: Zenith Bank\nAccount Number: 1016621205\nReference: ${linkCode}\n\nAfter payment, send your proof of payment via WhatsApp to +234 909 999 4816. Your membership will be activated within 24 hours.\n\nEvery ${fmtNGN(mTierData.monthly)} you contribute splits into two halves — the first half (${halfOne}) accumulates within your contribution cell and is returned to you as ${fmtNGN(mTierData.cyclePayout)} cash at the end of your 10-month cycle. The second half (${halfTwo}) merges with the second halves from all other contribution cells across the cooperative into a massive shared pool — half of which funds Approved Bill Support Requests (house rent, school fees, medical bills, etc.), and the other half caters for Approved Loan Requests, Operations and Reserve.\n\nOnce activated:\n— You will be placed in the ${mTierData.label} queue alongside other ${mTierData.label} members\n— A contribution cell of 10 members forms automatically when the queue reaches 10 registrants\n— You will begin earning CoFund Credit Score points everytime you pay your monthly contribution on time\n— Your unique Co-Fund Invite Link will go live for sharing — and you earn extra points with referral credits\n— You can change your tier any time before your cell activates\n\nAs a ${mTierData.label} member:\n— Cycle payout at end of 10 months: ${fmtNGN(mTierData.cyclePayout)} cash\n— Your bill support contribution over the cycle: ${fmtNGN(mTierData.billSupport*10)} — with up to ${fmtNGN(mTierData.billCaps[mTierData.billCaps.length-1].cap)} accessible once your credit score meets the minimum threshold\n— Loan access unlocks at a minimum of ${mTierData.unlockScore.toLocaleString()} credit points\n\nFor any questions, reply to this email or WhatsApp +234 909 999 4816.\n\nWarm regards,\nErnest Igbinoba\nPresident — CoFundBills Cooperative\ncofundbills@gmail.com\n+234 806 163 1222 | +234 909 999 4816\ncofundbills.vercel.app`,
    });
    setRegForm({fullName:"",email:"",phone:"",occupation:"",address:"",state:"",country:"Nigeria",
      nokName:"",nokPhone:"",nokRelationship:"",bankName:"",accountName:"",accountNumber:"",contributionTier:1});
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
    // Award first contribution credit
    const allM0 = await loadMembers();
    const activated = allM0[code];
    const aTier = getTier(activated?.contributionTier||1);
    await supabase.from("cfb_credit_events").insert({
      link_code:code, event_type:"contribution", points:aTier.pts.contribution,
      description:"First contribution — account activated",
    });
    await supabase.from("cfb_members").update({
      credit_score:(activated?.creditScore||0)+aTier.pts.contribution,
      months_contributed:1, contribution_balance:aTier.benefitPool,
    }).eq("link_code",code);
    // Award referral bonus to inviter using MIN tier rule
    if(activated?.refCode) {
      const inviter = allM0[activated.refCode];
      await awardReferralBonus(
        activated.refCode,
        inviter?.contributionTier||1,
        "activation",
        activated.contributionTier||1
      );
    }
    // Activation email sent manually from cofundbills@gmail.com
    const allM = await loadMembers();
    await tryFormCell(allM);
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
      contribution_balance:(m?.contributionBalance||0)+cTier.benefitPool,
    }).eq("link_code",linkCode);
    // Credit all seat holders
    const seats = cell.seats||[];
    for(const s of seats) {
      await addCredit(s.link_code,"cell_active",s.seat_type,cellCode,`Month ${monthNum}`);
    }
    await addCredit(linkCode,"contribution","contributing",cellCode,`Month ${monthNum} contribution`);
    // Update funds
    // Update funds based on cell tier
    const {data:cellTierData} = await supabase.from("cfb_cells").select("contribution_tier").eq("cell_code",cellCode).single();
    const cTierNum = cellTierData?.contribution_tier||1;
    const cTier = getTier(cTierNum);
    const bsFundKey = `bill_support_t${cTierNum}`;
    const loanFundKey = cTierNum>1?`loan_fund_t${cTierNum}`:"loan_fund";
    await supabase.from("cfb_funds").update({balance:(funds[bsFundKey]||funds.bill_support||0)+cTier.billSupport}).eq("fund_type",bsFundKey);
    await supabase.from("cfb_funds").update({balance:(funds[loanFundKey]||funds.loan_fund||0)+cTier.loanFund}).eq("fund_type",loanFundKey);
    await supabase.from("cfb_funds").update({balance:(funds.administration||0)+cTier.admin}).eq("fund_type","administration");
    await supabase.from("cfb_funds").update({balance:(funds.contingency||0)+cTier.contingency}).eq("fund_type","contingency");
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
    const {data:cellData} = await supabase.from("cfb_cells").select("contribution_tier").eq("cell_code",cellCode).single();
    const cellTierNum = cellData?.contribution_tier||1;
    const cellTier = getTier(cellTierNum);
    const contributors = seats.filter(s=>s.seat_type==="contributing");
    for(const c of contributors) {
      await supabase.from("cfb_payouts").insert({
        cell_code:cellCode, link_code:c.link_code, amount:cellTier.cyclePayout, status:"pending"
      });
      const m = members[c.link_code];
      await supabase.from("cfb_members").update({
        cycles_completed:(m?.cyclesCompleted||0)+1
      }).eq("link_code",c.link_code);
      // Cycle completion credit
      await supabase.from("cfb_credit_events").insert({
        link_code:c.link_code, event_type:"cycle_complete",
        points:cellTier.pts.cycleContrib, cell_code:cellCode,
        description:`Cycle completed — ${cellTier.label}`,
      });
      await supabase.from("cfb_members").update({
        credit_score:Math.max(0,(m?.creditScore||0)+cellTier.pts.cycleContrib)
      }).eq("link_code",c.link_code);
      // Award referral bonus cycle credit to inviter
      if(m?.refCode){
        const inviter = members[m.refCode];
        await awardReferralBonus(
          m.refCode,
          inviter?.contributionTier||1,
          "cycle",
          m.contributionTier||1
        );
      }
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
    const mTierData = getTier(m.contributionTier||1);
    if(m.creditScore < mTierData.unlockScore){
      showToast(`Minimum credit score of ${mTierData.unlockScore.toLocaleString()} pts required to access ${mTierData.label} loan service`,"error"); return;
    }
    const cat = scoreCategory(m.creditScore, m.contributionTier||1, m.memberType==="founding");
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
    const mTierData = getTier(member.contributionTier||1);
    if(member.creditScore < mTierData.unlockScore){ showToast(`Minimum credit score of ${mTierData.unlockScore.toLocaleString()} pts required for ${mTierData.label} services`,"error"); return; }
    const tierCap = getBillCap(funds[`bill_support_t${member.contributionTier||1}`]||funds.bill_support||0, member.contributionTier||1);
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

CORE LEGAL PRINCIPLE: No member earns cash from another member's contributions. Network position seats earn cooperative credit points only — never cash.

CONTRIBUTION CELL STRUCTURE (always exactly 10 members):
- 10 Contributing Members — all equal, all contributing, all sharing the cycle payout equally
- No network position seats — no network seats, no chains, no positional hierarchy in cells
- Cells form by tier queue — first activated, first placed
- Tiers never mix — Tier 1 with Tier 1, Tier 2 with Tier 2, etc.

HOST CREDIT SYSTEM (replaces network positions):
- When you invite someone and they activate: you earn Referral Bonus points at your tier rate
  Tier 1: +10 pts | Tier 2: +50 pts | Tier 3: +100 pts | Tier 4: +200 pts

- No seat required. No chain. No limit.
- Credits earned at the LOWER of inviter tier or invitee tier (MIN rule)
  Example: Tier 1 inviting Tier 4 → earns Tier 1 credits. Tier 4 inviting Tier 1 → earns Tier 1 credits. Tier 3 inviting Tier 4 → earns Tier 3 credits. You cannot earn above your own contribution station.
- Admin invite link earns NO Referral Bonuss. Admin is compensated via the 7.5% admin split only.

CONTRIBUTION TIERS (4 tiers available):
- Tier 1: NGN10,000/month → NGN50,000 cycle payout, bill support up to NGN500,000
- Tier 2: NGN50,000/month → NGN250,000 cycle payout, bill support up to NGN2,500,000
- Tier 3: NGN100,000/month → NGN500,000 cycle payout, bill support up to NGN5,000,000
- Tier 4: NGN200,000/month → NGN1,000,000 cycle payout, bill support up to NGN10,000,000

CONTRIBUTION SPLIT (same % across all tiers):
- Member Benefit Pool: 50% — paid equally to contributing members at cycle end
- Bill Support Fund: 25%
- Loan Fund: 12.5%
- Administration: 7.5%
- Contingency Reserve: 5% — covers any member defaults so your payout is always guaranteed

PAYOUT PROTECTION: If any cell member defaults, the Contingency Reserve covers the shortfall. Your cycle payout is guaranteed regardless of fellow members' behaviour.

TIER FLEXIBILITY: Members can change their contribution tier any time before their cell activates with 10 members. After activation, tier is locked for that cycle.

CROSS-TIER NETWORK SEATS: Network position holders earn points at the LOWER of their own tier or the cell's tier. You cannot earn above your contribution station.

CYCLE PAYOUT: NGN50,000 cash + 250 credit points per contributing member after 10 months. They contributed NGN100,000.

CELL FORMATION: Cells form instantly when 10 activated members are in the same tier's queue. First activated, first placed. No mergers. No timers. No forming state.

PAYMENT SCHEDULE:
- First payment activates membership and joins the queue. NO further payments until the cell activates.
- When cell activates: all 10 members receive email with Month 2 due date = last day of the FOLLOWING calendar month
- Monthly thereafter: due by the last day of each calendar month
- Last week of each month = reminder window
- Last day of month = deadline. Missing costs credit score points (not cycle payout — that is protected by Contingency Reserve)
- Example: Cell activates September → Month 2 due 31 October → Month 3 due 30 November etc.

CREDIT SCORE (behaviour-based, NOT recruitment-based):
- Monthly contribution on time: +20 pts (contributing members)
- Each month cell is active: +5/5/3/2/1 pts (contributing members)
- Cycle completed: +100 pts (contributing members) / +50 pts flat (all network seats)
- Missed contribution: -30 pts
- Loan repaid: +50 pts all
- Loan default: -100 pts all

LOAN & BILL SUPPORT ACCESS:
Services unlock at minimum credit score per tier:
- Tier 1: 400 pts minimum to unlock
- Tier 2: 2,000 pts minimum to unlock
- Tier 3: 4,000 pts minimum to unlock
- Tier 4: 8,000 pts minimum to unlock

Once unlocked, interest rate and loan limit by credit category (Tier 1 example):
- Excellent Performance (Lowest Risk) 1000+: 1%/month, max loan NGN600,000
- Strong Performance (Low Risk) 700-999: 2%/month, max loan NGN360,000
- Standard Performance (Medium Risk) 500-699: 3%/month, max loan NGN180,000
- Minimal Performance (Higher-Risk) below 500: 4%/month, max loan NGN60,000
All limits scale proportionally with contribution tier.
Loans subject to fund liquidity and admin approval. Credits improve eligibility — do not guarantee approval.

BILL SUPPORT — COOPERATIVE FUNDING CAPACITY TIER (CRITICAL):
The funding capacity tier (Bronze/Silver/Gold/Platinum) is NOT determined by the member's own contribution tier. It is determined entirely by the COOPERATIVE'S ACTUAL BILL SUPPORT FUND BALANCE at the time the member submits their request. The fund is shared across all tiers and built from 25% of every monthly contribution platform-wide.

The member portal Bill Support tab shows the live fund balance and current funding capacity tier at any time. Members cannot know their exact claim limit in advance — it depends on what the fund holds at the moment of their request.

How to tell the cooperative funding capacity tier at time of request: Open the Bill Support tab in your member portal. You will see the current fund balance and which tier is active — Bronze, Silver, Gold or Platinum — along with the maximum claim available to you right now.

Funding capacity tiers per member contribution tier:
Tier 1: Bronze (fund <NGN2M) NGN100k max | Silver (NGN2M-5M) NGN250k max | Gold (NGN5M-10M) NGN350k max | Platinum (NGN10M+) NGN500k max
Tier 2: Bronze (fund <NGN10M) NGN500k max | Silver (NGN10M-25M) NGN1.25M max | Gold (NGN25M-50M) NGN1.75M max | Platinum (NGN50M+) NGN2.5M max
Tier 3: Bronze (fund <NGN20M) NGN1M max | Silver (NGN20M-50M) NGN2.5M max | Gold (NGN50M-100M) NGN3.5M max | Platinum (NGN100M+) NGN5M max
Tier 4: Bronze (fund <NGN40M) NGN2M max | Silver (NGN40M-100M) NGN5M max | Gold (NGN100M-200M) NGN7M max | Platinum (NGN200M+) NGN10M max

Always direct members to check their portal Bill Support tab for their live claim limit. Never tell a member their maximum claim is fixed — it fluctuates with the fund balance.

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
            <div style={{fontSize:11,color:C.muted}}>{seats.length} members · Month {cell.month_number||0}/{CYCLE_MONTHS}</div>
          </div>
          <span className="pill" style={{
            background:cell.status==="active"?"#BBF7D0":cell.status==="completed"?"#BFDBFE":"#FEF3C7",
            color:cell.status==="active"?"#166534":cell.status==="completed"?C.blue:"#92400E",
          }}>{cell.status}</span>
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
    ["What is a Contribution Cell?","A contribution cell is a group of 10 contributing members who each pay ₦10,000/month for 10 months, Cells form automatically when 10 activated members are in the same tier's queue. No network seats. No chains. First activated, first placed."],
    ["How much do I receive at cycle end?","Each contributing member receives ₦50,000 cash at cycle end, plus 250 credit points (20 per month × 10 months + 100 cycle completion bonus). You will have contributed ₦100,000 in total. The ₦50,000 difference funds the cooperative: bill support (25% — ₦2,500/month), loan fund (10%), administration (10%) and contingency reserve (5%) for default payments, operational shocks and make-up funds."],
    ["What is a Founding Member?","Founding Members are personally invited by the cooperative\'s admin to help establish the cooperative\'s founding register — a minimum of 20 founding members is required under Lagos State law to register a Multi-Purpose Cooperative Society. Founding Members contribute and participate exactly like all regular members. Their exclusive benefit is a quarterly share of the cooperative\'s loan interest revenue. Every quarter, loan interest income is divided into 25 equal slots — 23 slots distributed equally among all active Founding Members, and 2 slots allocated to the cooperative\'s Admin. This quarterly distribution is permanent and in addition to their normal cycle payouts and Referral Bonuss."],
    ["What is Referral Bonus?","When you share your invite link and someone activates their membership through it, you automatically earn Referral Bonus points — scored at the lower of the two tiers between you and the invited member. There are no seats, no chains and no limits — you earn Referral Bonuss for every activated member you bring into the cooperative."],
    ["What is the CoFund Credit Score?","Your credit score is built from your cooperative behaviour: +20 per monthly contribution (contributing members), +5 per active cell month equally across all seat types, +100 for a completed cycle (contributing members) and +50 flat for all network seat holders at cycle end. Deductions for missed contributions (−30), loan defaults (−100) and bill support claims (−500). A higher score gives better loan access, lower interest rates and unlocks bill support eligibility at 1,000+ points."],
    ["What loan can I access?","Based on your CoFund Credit Score: Loan and bill support services unlock at a minimum credit score per tier: Tier 1 at 400 pts, Tier 2 at 2,000 pts, Tier 3 at 4,000 pts, Tier 4 at 8,000 pts. Once unlocked, your interest rate and loan limit are determined by your credit score category — Excellent Performance (lowest risk): 1%/month · Strong Performance: 2%/month · Standard Performance: 3%/month · Minimal Performance: 4%/month. Loan limits scale with your contribution tier and credit category. Approval is subject to available fund liquidity, repayment capacity and cooperative credit policy."],
    ["What is the Bill Support Fund?","25% of every contribution (₦2,500 per ₦10,000 paid) funds the cooperative's Bill Support Fund. Active members can apply for support for house rent, school fees, medical bills, electricity, water and household essentials. Applications are reviewed by admin."],
    ["How do contribution cells form?","When you activate your membership, you join your tier's queue — Tier 1 with Tier 1, Tier 2 with Tier 2, and so on. The moment 10 members are in the queue, a new contribution cell forms instantly and automatically. First activated, first placed. Tiers never mix. There are no mergers, no timers and no complicated arrangements."],
    ["Is CoFundBills a Pyramid Scheme?","No — CoFundBills is not a pyramid scheme. Invite links earn Referral Bonus points only — never cash. The cooperative functions with zero new members. Earnings come from cycle completion — not from recruiting others. The credit score rewards contribution discipline and repayment history. CoFundBills is being registered as a Multi-Purpose Cooperative Society under Lagos State law. Every naira has a documented destination."],
    ["What contribution tiers are available?","CoFundBills offers four contribution tiers. Tier 1 (₦10,000/month) — cycle payout ₦50,000, bill support up to ₦500,000. Tier 2 (₦50,000/month) — cycle payout ₦250,000, bill support up to ₦2,500,000. Tier 3 (₦100,000/month) — cycle payout ₦500,000, bill support up to ₦5,000,000. Tier 4 (₦200,000/month) — cycle payout ₦1,000,000, bill support up to ₦10,000,000. You choose your tier at registration and can change it any time before your cell activates."],
    ["What if a member in my cell defaults on their contribution?","Your payout is fully protected. The cooperative's dedicated Contingency Reserve covers any member's missed contribution immediately — you will never be shortchanged because of someone else's default. Defaulting members face a credit score deduction of 30 points per missed month and are subject to cooperative disciplinary action. Their failure never reaches you. This is why the Contingency Reserve exists — to absorb shocks so the cooperative's promises to you are always kept."],
    ["What is the contribution payment schedule?","Your first monthly contribution activates your membership and places you in your tier's queue — this is the only payment required until your contribution cell activates. When 10 members queue up and your cell forms, you will receive an email with your Month 2 due date — the last day of the following calendar month. From then, contributions are due by the last day of every calendar month. The last week of each month is your reminder window. Missing the deadline costs you credit score points, though your cycle payout remains protected by the cooperative's Contingency Reserve."],
    ["How do I activate my membership?","After registering, make your first monthly contribution of ₦10,000 to: Royal Tech Partnership & Investment Limited, Zenith Bank, Account 1016621205. Use your link code as reference. WhatsApp +234 909 999 4816. Admin activates your account and you are automatically placed in a forming cell."],
  ];

  // ── T&C sections ──────────────────────────────────────────────
  const TCS = [
    ["1. Membership","Membership is open to individuals who register through the platform and pay the first monthly contribution of ₦10,000. Membership is personal and non-transferable."],
    ["2. Contribution Obligation","Contributing members must pay ₦10,000 monthly for the full 10-month cycle. Failure to contribute suspends cycle payout eligibility and cooperative service access until arrears are cleared."],
    ["3. Contribution Cell","Members are automatically assigned to a contribution cell upon activation. Cell size ranges from 10 to 14 members. The cycle runs for 10 months."],
    ["4. Contribution Split","Every ₦10,000: Member Benefit Pool 50% (₦5,000), Bill Support Fund 25% (₦2,500), Loan Fund 12.5% (₦1,250), Administration 7.5% (₦750), Contingency Reserve 5% (₦500)."],
    ["5. Cycle Payout","₦50,000 cash is paid to each contributing member at cycle completion, plus credit points earned during the cycle. Payouts are processed within 7 business days of cycle completion."],
    ["5b. Founding Member Benefits","Founding Members enjoy two exclusive financial privileges: (1) Zero interest rate on all approved Co-Fund Loans — regardless of credit score category. (2) Exclusive quarterly share of the cooperative's loan interest revenue — 23 of every 25 quarterly slots distributed equally among all active Founding Members, and 2 slots to the cooperative's Admin. Both benefits are permanent and in addition to regular cycle payouts."],
    ["6. Network Positions","Members who invite others earn Referral Bonus points — on invitee activation and cycle completion. No member receives cash or guaranteed financial return for introducing another member."],
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
  const AjoApp = () => (
    <div style={{minHeight:"100vh",background:C.bg}}>
      <div style={{background:`linear-gradient(90deg,${C.navy},${C.blue})`,padding:"14px 24px",
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:900,color:C.white,fontSize:16}}>🧺 CoFundBills — Import Ajo</div>
        <button style={{background:"rgba(255,255,255,.15)",border:"none",color:C.white,
          borderRadius:20,padding:"6px 16px",fontSize:12,cursor:"pointer",fontWeight:600}}
          onClick={()=>{setView("landing");setAjoView("landing");}}>← Back to CoFundBills</button>
      </div>
      {ajoView==="landing"&&(<div style={{padding:"48px 24px"}}><div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <span className="section-tag" style={{background:"#FEF3C7",color:C.amber}}>Import Ajo — Free Service</span>
          <h2 className="section-title">Bring Your Ajo Group Online</h2>
          <p className="section-sub" style={{maxWidth:580,margin:"0 auto"}}>Keep your own rules, your own account, your own payout order. We handle reminders, transparency and record keeping — completely free.</p>
        </div>
        <div className="grid-2" style={{marginBottom:36}}>{[
          {icon:"📅",title:"Automated Reminders",desc:"We email every member when their contribution date approaches.",c:C.blue},
          {icon:"📊",title:"Full Transparency",desc:"Every member sees who has paid. Coordinator records proofs and payouts.",c:C.green},
          {icon:"🏦",title:"Your Account, Your Rules",desc:"Contributions go to your group's own bank account. CoFundBills never touches your money.",c:C.amber},
          {icon:"🆓",title:"Completely Free",desc:"No charges, no commissions, no catches. Just better tools for your Ajo circle.",c:C.burg},
        ].map(f=>(<div key={f.title} className="card" style={{borderLeft:`3px solid ${f.c}`}}>
          <div style={{fontSize:24,marginBottom:8}}>{f.icon}</div>
          <div style={{fontWeight:800,color:f.c,marginBottom:6,fontSize:13}}>{f.title}</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>{f.desc}</div>
        </div>))}</div>
        <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-primary" style={{fontSize:15,padding:"14px 32px"}} onClick={()=>setAjoView("create")}>➕ Register Your Group</button>
          <button className="btn btn-outline" style={{fontSize:15,padding:"14px 32px"}} onClick={()=>setAjoView("join")}>🔑 Join an Existing Group</button>
        </div>
      </div></div>)}
      {ajoView==="create"&&(
        <div style={{padding:"40px 24px",overflowY:"auto"}}>
          <div style={{maxWidth:600,margin:"0 auto"}}>
            <button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,marginBottom:20}}
              onClick={()=>setAjoView("landing")}>← Back</button>
            <h2 style={{color:C.navy,fontWeight:900,fontSize:22,marginBottom:4}}>Register Your Ajo Group</h2>
            <p style={{color:C.muted,fontSize:13,marginBottom:24,lineHeight:1.7}}>Fill in your group details below. You will receive a unique Group Code to share with your members instantly.</p>
            <div className="card">
              <div style={{marginBottom:14}}>
                <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Group Name</label>
                <input type="text" placeholder="e.g. Victoria Island Ladies Circle"
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.groupName?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                  value={ajoForm.groupName} onChange={e=>setAjoForm({...ajoForm,groupName:e.target.value})}/>
                {ajoErrors.groupName&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.groupName}</div>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Coordinator Full Name</label>
                <input type="text" placeholder="Your full name"
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.coordinatorName?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                  value={ajoForm.coordinatorName} onChange={e=>setAjoForm({...ajoForm,coordinatorName:e.target.value})}/>
                {ajoErrors.coordinatorName&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.coordinatorName}</div>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Coordinator Phone</label>
                  <input type="tel" placeholder="+234..."
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.coordinatorPhone?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.coordinatorPhone} onChange={e=>setAjoForm({...ajoForm,coordinatorPhone:e.target.value})}/>
                  {ajoErrors.coordinatorPhone&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.coordinatorPhone}</div>}
                </div>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Coordinator Email</label>
                  <input type="email" placeholder="(gmail preferably)"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.coordinatorEmail?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.coordinatorEmail} onChange={e=>setAjoForm({...ajoForm,coordinatorEmail:e.target.value})}/>
                  {ajoErrors.coordinatorEmail&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.coordinatorEmail}</div>}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>No. of Members</label>
                  <input type="number" placeholder="e.g. 10"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.memberCount?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.memberCount} onChange={e=>setAjoForm({...ajoForm,memberCount:e.target.value})}/>
                  {ajoErrors.memberCount&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.memberCount}</div>}
                </div>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Monthly Amount</label>
                  <input type="number" placeholder="e.g. 10000"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.contributionAmount?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.contributionAmount} onChange={e=>setAjoForm({...ajoForm,contributionAmount:e.target.value})}/>
                  {ajoErrors.contributionAmount&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.contributionAmount}</div>}
                </div>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Contribution Day</label>
                  <input type="number" min="1" max="31" placeholder="e.g. 25"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.contributionDay?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.contributionDay} onChange={e=>setAjoForm({...ajoForm,contributionDay:e.target.value})}/>
                  {ajoErrors.contributionDay&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.contributionDay}</div>}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Payout Frequency</label>
                  <select style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,background:C.white,boxSizing:"border-box"}}
                    value={ajoForm.payoutFrequency} onChange={e=>setAjoForm({...ajoForm,payoutFrequency:e.target.value})}>
                    <option>Monthly</option><option>Bi-Monthly</option><option>Quarterly</option><option>Custom</option>
                  </select>
                </div>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Cycle Start Date (optional)</label>
                  <input type="date"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.cycleStartDate} onChange={e=>setAjoForm({...ajoForm,cycleStartDate:e.target.value})}/>
                </div>
              </div>
              <div style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontWeight:800,color:C.blue,fontSize:12,marginBottom:10}}>🏦 Group Payout Account</div>
                <div style={{marginBottom:10}}>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Bank Name</label>
                  <input type="text" placeholder="e.g. Access Bank"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.bankName?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.bankName} onChange={e=>setAjoForm({...ajoForm,bankName:e.target.value})}/>
                  {ajoErrors.bankName&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.bankName}</div>}
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Account Name</label>
                  <input type="text" placeholder="e.g. Victoria Ladies Circle"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.accountName?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.accountName} onChange={e=>setAjoForm({...ajoForm,accountName:e.target.value})}/>
                  {ajoErrors.accountName&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.accountName}</div>}
                </div>
                <div>
                  <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>Account Number</label>
                  <input type="text" placeholder="10-digit account number"
                    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1.5px solid ${ajoErrors.accountNumber?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                    value={ajoForm.accountNumber} onChange={e=>setAjoForm({...ajoForm,accountNumber:e.target.value})}/>
                  {ajoErrors.accountNumber&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors.accountNumber}</div>}
                </div>
              </div>
              <button className="btn btn-primary" style={{width:"100%",padding:14,fontSize:14}}
                onClick={handleCreateAjo}>➕ Create Group Portal</button>
            </div>
          </div>
        </div>
      )}
      {ajoView==="join"&&(<div style={{padding:"40px 24px",display:"flex",alignItems:"center",justifyContent:"center",minHeight:"70vh"}}><div style={{width:"100%",maxWidth:420}}>
        <button style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,marginBottom:20}} onClick={()=>setAjoView("landing")}>← Back</button>
        <div className="card">
          <h3 style={{color:C.navy,fontWeight:900,marginBottom:6}}>Join Your Group</h3>
          <p style={{color:C.muted,fontSize:12,marginBottom:20}}>Enter the Group Code shared by your coordinator.</p>
          {[["groupCode","Group Code","text","e.g. AJO-ABC123"],["name","Full Name","text",""],
            ["phone","Phone","tel","+234..."],["email","Email","email","(gmail address preferably)"]].map(([k,l,t,p])=>(
            <div key={k} style={{marginBottom:14}}>
              <label style={{fontWeight:700,fontSize:12,color:C.navy,display:"block",marginBottom:4}}>{l}</label>
              <input type={t} placeholder={p} style={{width:"100%",padding:"10px 12px",borderRadius:8,
                border:`1.5px solid ${ajoErrors[k]?C.error:C.border}`,fontSize:13,boxSizing:"border-box"}}
                value={ajoJoinForm[k]} onChange={e=>setAjoJoinForm({...ajoJoinForm,[k]:e.target.value})}/>
              {ajoErrors[k]&&<div style={{color:C.error,fontSize:11,marginTop:3}}>{ajoErrors[k]}</div>}
            </div>))}
          <button className="btn btn-primary" style={{width:"100%",padding:14,fontSize:14}} onClick={handleJoinAjo}>🔑 Enter Group Portal</button>
        </div>
      </div></div>)}
      {ajoView==="portal"&&currentAjo&&(()=>{
        const grp=ajoGroups[currentAjo];
        if(!grp) return <div style={{padding:40,textAlign:"center",color:C.muted}}>Loading...</div>;
        const grpMembers=ajoMembers.filter(m=>m.group_code===currentAjo);
        const grpPayments=ajoPayments.filter(p=>p.group_code===currentAjo);
        const currentMonth=new Date().toISOString().slice(0,7);
        const getPaid=(id,ref)=>grpPayments.find(p=>p.member_id===id&&p.month_ref===ref&&p.status==="confirmed");
        const getPayout=(id,ref)=>grpPayments.find(p=>p.member_id===id&&p.month_ref==="PAYOUT-"+ref&&p.status==="payout_confirmed");
        return(<div style={{padding:"24px 16px",maxWidth:860,margin:"0 auto"}}>
          <div style={{background:C.white,borderRadius:12,padding:16,marginBottom:20,border:`1.5px solid ${C.border}`,
            display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:4}}>🏦 Group Contribution Account</div>
              <div style={{fontSize:13,color:C.dark,lineHeight:1.8}}><strong>{grp.account_name}</strong><br/>{grp.bank_name} — <strong>{grp.account_number}</strong></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:C.muted}}>Per member / month</div>
              <div style={{fontWeight:900,color:C.navy,fontSize:22}}>{fmtNGN(grp.contribution_amount)}</div>
              <div style={{fontSize:11,color:C.muted}}>Due: {grp.contribution_day}th of month</div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{fontWeight:800,color:C.navy,fontSize:14}}>📋 {new Date().toLocaleString("en-NG",{month:"long",year:"numeric"})} — Status</div>
            <button className="btn btn-outline btn-sm" onClick={()=>sendAjoReminders(currentAjo)}>📧 Send Reminders</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            {grpMembers.map(mem=>{
              const paid=getPaid(mem.id,currentMonth);
              const paidOut=getPayout(mem.id,currentMonth);
              return(<div key={mem.id} style={{background:C.white,borderRadius:12,padding:14,
                border:`1.5px solid ${paid?"#BBF7D0":C.border}`,
                display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:700,color:C.navy,fontSize:13}}>{mem.name}
                    {mem.role==="coordinator"&&<span style={{background:C.gold,color:C.white,borderRadius:20,padding:"2px 8px",fontSize:10,marginLeft:8}}>Coordinator</span>}
                  </div>
                  <div style={{fontSize:11,color:C.muted}}>{mem.phone}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  {paidOut&&<span style={{background:"#7C3AED",color:C.white,borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:700}}>💰 Payout Received</span>}
                  {paid?<span style={{background:C.green,color:C.white,borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:700}}>✅ Paid</span>
                    :<span style={{background:"#FEE2E2",color:C.error,borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:700}}>⏳ Pending</span>}
                  {!paid&&<button style={{background:C.blue,color:C.white,border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:700}}
                    onClick={()=>handleAjoPayment(mem.id,currentMonth)}>Mark Paid</button>}
                  {paid&&!paidOut&&<button style={{background:"#7C3AED",color:C.white,border:"none",borderRadius:20,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:700}}
                    onClick={()=>handleAjoPayout(mem.id,currentMonth)}>Record Payout</button>}
                </div>
              </div>);
            })}
          </div>
          <div style={{background:C.white,borderRadius:12,padding:16,marginBottom:24,border:`1.5px solid ${C.border}`}}>
            <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:12}}>➕ Add Member</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
              {[["name","Full Name","text"],["phone","Phone","tel"],["email","Email","email"]].map(([k,l,t])=>(
                <div key={k}>
                  <label style={{fontWeight:700,fontSize:11,color:C.navy,display:"block",marginBottom:3}}>{l}</label>
                  <input type={t} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:12,boxSizing:"border-box"}}
                    value={ajoJoinForm[k]||""} onChange={e=>setAjoJoinForm({...ajoJoinForm,[k]:e.target.value})}/>
                </div>))}
            </div>
            <button className="btn btn-outline btn-sm" onClick={async()=>{
              if(!ajoJoinForm.name||!ajoJoinForm.phone){showToast("Name and phone required");return;}
              await supabase.from("cfb_ajo_members").insert({group_code:currentAjo,name:ajoJoinForm.name.trim(),
                phone:ajoJoinForm.phone.trim(),email:ajoJoinForm.email?.trim()||"",role:"member",status:"active"});
              setAjoJoinForm({groupCode:"",name:"",phone:"",email:""});
              await loadAjoGroup(currentAjo);showToast("Member added.");
            }}>Add Member</button>
          </div>
          <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,borderRadius:14,padding:20,color:C.white,textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:8}}>💡</div>
            <div style={{fontWeight:900,fontSize:15,marginBottom:8}}>Want More From Your Savings?</div>
            <div style={{fontSize:13,opacity:.85,lineHeight:1.8,marginBottom:16}}>CoFundBills Cooperative takes your thrift contribution further — with credit scores, loan access, bill support funds and cycle payouts up to ₦1,000,000. All governed by cooperative law.</div>
            <button className="btn btn-primary" style={{background:C.gold,color:C.navy,fontWeight:800}}
              onClick={()=>{setView("landing");setAjoView("landing");}}>Learn About CoFundBills Cooperative →</button>
          </div>
        </div>);
      })()}
    </div>
  );

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
      <div style={{background:C.navy,padding:"14px 24px 10px",display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginBottom:0}}>
        {[["₦10,000","Monthly Contribution"],["₦50,000 + 250 pts","Cycle Payout / Credit Bonus"],["10 Months","Contribution Cycle"],["10–14","Members Per Cell"],["1%–4%","Loan Rate/Month"],["50%","Benefit Pool Split"]].map(([v,l])=>(
          <div key={l} style={{background:C.gold,borderRadius:28,padding:"9px 18px",textAlign:"center",minWidth:120}}>
            <div style={{fontSize:13,fontWeight:900,color:C.navy}}>{v}</div>
            <div style={{fontSize:10,fontWeight:700,color:C.navy,opacity:.75,textTransform:"uppercase",letterSpacing:.4}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tier overview belt */}
      <div style={{background:"#0A1929",padding:"12px 24px 16px",display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{color:"rgba(255,255,255,.5)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,display:"flex",alignItems:"center",marginRight:4}}>Contribution Tiers:</div>
        {Object.values(TIERS).map(t=>(
          <div key={t.id} style={{background:t.color+"22",border:`1px solid ${t.color}55`,borderRadius:20,padding:"6px 14px",textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:800,color:t.color}}>{t.label} — {t.name}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)",marginTop:1}}>Cycle payout: {fmtNGN(t.cyclePayout)}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="section" style={{background:C.white}}>
        <div className="section-inner" style={{textAlign:"center"}}>
          <span className="section-tag" style={{background:"#EFF6FF",color:C.blue}}>The Contribution Cell</span>
          <h2 className="section-title">How CoFundBills Works</h2>
          <p className="section-sub" style={{margin:"0 auto 28px"}}>Members join contribution cells of exactly 10 contributing members — all equal, all contributing, all sharing the cycle payout equally. Cells form automatically when 10 activated members are in the same tier's queue. Your invite link earns you Referral Bonus bonus — no seats, no chains, just credit bonus points for every activated member that joined the cooperative on your invite.</p>
          <div className="grid-3" style={{marginBottom:24}}>
            {[
              {icon:"💳",title:"10 Contributing Members",desc:"Each pays their tier's monthly contribution for 10 months. At cycle end, each receives 50% of their total contributions back as cash. The other 50% merges with the 50% from all other contribution cells across the cooperative into a massive shared pool — half of which funds Approved Bill Support Requests (house rent, school fees, medical bills, etc.), and the other half caters for Approved Loan Requests, Operations and Reserve.",color:C.blue},
              {icon:"🤝",title:"Referral Bonus",desc:"When you invite someone and they activate their membership through your link, you earn Referral Bonus points automatically — at the lower of the two tiers between you and the invited member. No seats, no chains, no limits.",color:C.green},
              {icon:"🎖️",title:"Founding Members",desc:"Personally invited by cooperative admin to establish the founding register required for cooperative registration. Founding Members contribute and participate like all regular members — with one exclusive benefit: a share in the cooperative's quarterly loan interest revenue.",color:C.burg},
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
                {l:"Loan Fund",a:"₦1,250",p:"12.5%",c:C.purple},
                {l:"Administration",a:"₦750",p:"7.5%",c:C.amber},
                {l:"Contingency Reserve",a:"₦500", p:"5%", c:C.burg},
              ].map(s=>(
                <div key={s.l} style={{background:C.bg,borderRadius:10,padding:12,borderLeft:`3px solid ${s.c}`}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.c}}>{s.a} <span style={{fontSize:11}}>{s.p}</span></div>
                  <div style={{fontSize:11,fontWeight:700,color:C.navy,marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contingency protection */}
          <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:12,padding:18,marginBottom:16,display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{fontSize:28,flexShrink:0}}>🛡️</div>
            <div>
              <div style={{fontWeight:800,color:"#166534",fontSize:14,marginBottom:6}}>Your Payout is Protected — Always</div>
              <div style={{fontSize:13,color:"#166534",lineHeight:1.8}}>
                You may end up in a contribution cell with absolute strangers. That is by design — and it is safe. If any member in your cell defaults on a monthly payment, the cooperative's dedicated <strong>Contingency Reserve</strong> covers the shortfall immediately. Your cycle payout is guaranteed in full regardless of what fellow cell members do. Defaulters face credit score deductions and cooperative disciplinary action. You are never affected.
              </div>
            </div>
          </div>

          {/* Cycle payout */}
          <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,borderRadius:14,padding:22,color:C.white,marginBottom:8}}>
            <div style={{fontWeight:900,fontSize:17,marginBottom:14}}>Cycle Payout — What Every Contributing Member Receives</div>
            {Object.values(TIERS).map(t=>(
              <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.1)",flexWrap:"wrap",gap:4}}>
                <div style={{fontSize:13,opacity:.85}}>
                  <strong style={{color:C.gold}}>{t.label}:</strong> {fmtNGN(t.benefitPool)} × 10 months × 10 members = <strong style={{color:C.gold}}>{fmtNGN(t.benefitPool*100)} total benefit pool</strong>
                </div>
                <div style={{fontSize:13,opacity:.85}}>
                  Divided equally → <strong style={{color:C.gold}}>{fmtNGN(t.cyclePayout)} per member</strong>
                </div>
              </div>
            ))}
            <div style={{fontSize:11,opacity:.65,lineHeight:1.7,marginTop:12}}>
              * Each contributing member receives half of their 10 months contributions as cashback at the end of a cycle. The other half merges with the halves from all other contribution cells across the cooperative into a massive shared pool — half of which funds Approved Bill Support Requests (house rent, school fees, medical bills, etc.), and the other half caters for Approved Loan Requests, Operations and Reserve.
            </div>
          </div>
        </div>
      </div>

      {/* Cell Merger */}
      <div className="section" style={{background:C.bg}}>
        <div className="section-inner">
          <span className="section-tag" style={{background:"#FEF3C7",color:C.amber}}>How Your Cell Forms</span>
          <h2 className="section-title">Simple. Fair. Automatic.</h2>
          <p className="section-sub">There are no complex group arrangements or network chains. When you activate your membership, you simply join your tier's queue. The moment 10 members are in the queue — a new contribution cell forms instantly. First activated, first placed.</p>
          <div className="grid-2">
            {[
              {icon:"🎯",title:"Four Independent Queues",desc:"One queue per contribution tier. Tier 1 members form Tier 1 cells. Tier 2 members form Tier 2 cells. Tiers never mix. You always contribute alongside members at the same level.",color:C.blue},
              {icon:"⚡",title:"Instant Cell Formation",desc:"The moment 10 activated members are in a tier's queue, a new contribution cell forms automatically — no waiting, no admin intervention, no complicated arrangements.",color:C.green},
              {icon:"🔄",title:"Tier Flexibility",desc:"You can change your contribution tier any time before your cell forms. Switch up or down — you simply move to the back of your new tier's queue.",color:C.amber},
              {icon:"🛡️",title:"Your Payout is Protected",desc:"If any cell member defaults, the cooperative's Contingency Reserve covers the shortfall immediately. Your cycle payout is guaranteed regardless of fellow members' behaviour.",color:C.burg},
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
          <p className="section-sub">Your CoFund Credit Score is earned through disciplined participation and measured behavioural performances — not through who you invite to join the cooperative — even though there is a marginal score credit for referral bonuses. Better behaviour means better loan rates, higher loan limits and access to essential bill support funds. Each contribution tier has its own credit score scale — proportional to your monthly commitment.</p>

          {Object.values(TIERS).map(t=>(
            <div key={t.id} style={{marginBottom:32}}>
              <div style={{background:`linear-gradient(135deg,${t.color},${t.color}CC)`,borderRadius:"14px 14px 0 0",
                padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{color:C.white,fontWeight:900,fontSize:16}}>{t.label} Contribution Group</div>
                  <div style={{color:"rgba(255,255,255,.75)",fontSize:12,marginTop:2}}>{t.name} · Cycle payout: {fmtNGN(t.cyclePayout)} · Unlock services at {t.unlockScore.toLocaleString()} pts</div>
                </div>
                <div style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"6px 14px",color:C.white,fontSize:12,fontWeight:700}}>{fmtNGN(t.monthly)}/month</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
                border:`1px solid ${t.color}44`,borderTop:"none",borderRadius:"0 0 14px 14px",overflow:"hidden"}}>
                <div style={{padding:18,borderRight:`1px solid ${t.color}22`,background:C.white}}>
                  <div style={{fontWeight:800,color:t.color,fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>How You Earn Points</div>
                  {[
                    [`Monthly contribution on time`,`+${t.pts.contribution} pts`,"Contributing Members"],
                    [`Each month your cell is active`,`+${t.pts.cellActive} pts`,"All contributing members"],
                    [`Cycle completed (contributing)`,`+${t.pts.cycleContrib.toLocaleString()} pts`,"Contributing Members"],

                    [`Referral Bonus — invited member activates`,`+${t.pts.referralActivation} pts`,"Credit bonus decided by the referral bonus tied to the lower of the two tiers where the Invited activates a different tier"],
                    [`Loan repaid on time`,`+${t.pts.loanRepaid.toLocaleString()} pts`,"All members"],
                    [`Missed contribution`,`${t.pts.missed} pts`,"Contributing Members"],
                    [`Loan default`,`${t.pts.loanDefault.toLocaleString()} pts`,"All members"],
                    [`Bill support claim`,`${t.pts.billClaim.toLocaleString()} pts`,"Score deduction on approval"],
                  ].map(([e,p,w])=>(
                    <div key={e} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.bg}`,fontSize:11}}>
                      <div><div style={{color:C.navy,fontWeight:600}}>{e}</div><div style={{fontSize:10,color:C.muted}}>{w}</div></div>
                      <span style={{fontWeight:900,color:p.startsWith("+")?"#166534":C.error,fontSize:12,marginLeft:8,flexShrink:0}}>{p}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:18,borderRight:`1px solid ${t.color}22`,background:"#FAFBFF"}}>
                  <div style={{fontWeight:800,color:t.color,fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Credit Score → Loan Access</div>
                  {[
                    {l:"Excellent Performance (Lowest Risk)",r:`${t.excellentScore.toLocaleString()}+`,rate:"1%/month",limit:t.loanLimits.excellent,c:C.green},
                    {l:"Strong Performance (Low Risk)",r:`${t.strongScore.toLocaleString()}–${(t.excellentScore-1).toLocaleString()}`,rate:"2%/month",limit:t.loanLimits.strong,c:C.blue},
                    {l:"Standard Performance (Medium Risk)",r:`${t.standardScore.toLocaleString()}–${(t.strongScore-1).toLocaleString()}`,rate:"3%/month",limit:t.loanLimits.standard,c:C.amber},
                    {l:"Minimal Performance (Higher-Risk)",r:`Below ${t.standardScore.toLocaleString()}`,rate:"4%/month",limit:t.loanLimits.minimal,c:C.error},
                  ].map(c=>(
                    <div key={c.l} style={{borderRadius:8,border:`1.5px solid ${c.c}33`,padding:9,marginBottom:7,background:c.c+"0D"}}>
                      <div style={{fontWeight:800,color:c.c,fontSize:11}}>{c.l}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{c.r} pts</div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                        <span style={{fontWeight:700,color:C.navy,fontSize:11}}>{c.rate}</span>
                        <span style={{fontSize:10,color:C.muted}}>Max: {fmtNGN(c.limit)}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{background:`${t.color}11`,border:`1px solid ${t.color}33`,borderRadius:8,padding:9,fontSize:11,color:t.color,lineHeight:1.6,marginTop:8}}>
                    🔓 Unlock loan service with a minimum of <strong>{t.unlockScore.toLocaleString()} credit score</strong><br/>
                    <span style={{color:C.muted,fontSize:10}}>Loan approval subject to fund liquidity, repayment capacity and cooperative credit policy.</span>
                  </div>
                </div>
                <div style={{padding:18,background:C.white}}>
                  <div style={{fontWeight:800,color:t.color,fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Essential Bill Support Access</div>
                  {t.billCaps.map((cap,i)=>{
                    const capColor = cap.tier==="Platinum"?"#0B6E4F":cap.tier==="Gold"?"#C9A84C":cap.tier==="Silver"?"#6B7280":"#B45309";
                    return(
                    <div key={i} style={{borderRadius:8,border:`1.5px solid ${capColor}33`,padding:10,marginBottom:7,background:capColor+"0D"}}>
                      <div style={{fontWeight:800,fontSize:11,color:capColor,marginBottom:4}}>Cooperative Funding Capacity at {cap.tier} Tier</div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11}}>
                        <div style={{color:C.muted}}>
                          Available Fund: {cap.min===0?`Up to ${fmtNGN(cap.max)}`:`${fmtNGN(cap.min)}${cap.max<Infinity?` – ${fmtNGN(cap.max)}`:"+"}` }
                        </div>
                        <div style={{fontWeight:900,color:C.navy,flexShrink:0,marginLeft:8}}>Support: {fmtNGN(cap.cap)} Max</div>
                      </div>
                    </div>
                    );
                  })}
                  <div style={{background:`${t.color}11`,border:`1px solid ${t.color}33`,borderRadius:8,padding:9,fontSize:11,color:t.color,lineHeight:1.6,marginTop:8}}>
                    🔓 Unlock Essential Bills Support with a minimum of <strong>{t.unlockScore.toLocaleString()} credit score</strong><br/>
                    <span style={{color:C.muted,fontSize:10}}>Support received subject to cooperative funding capacity tier at the material time of your request.</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Support */}
      <div className="section" style={{background:C.white}}>
        <div className="section-inner" style={{textAlign:"center"}}>
          <span className="section-tag" style={{background:"#F0FDF4",color:C.green}}>Essential Bill Support</span>
          <h2 className="section-title">Collective Bill Financing</h2>
          <p className="section-sub" style={{margin:"0 auto 24px"}}>25% of every contribution (₦2,500 per ₦10,000 paid) funds the cooperative Bill Support Fund. Active members with a credit score of 1,000+ can apply for support for their self-selected essential bills — up to ₦500,000 per claim from the Bill Support pool — once in every 10-month cycle — subject to CoFundBills Cooperative's available fund tier at the point of request.</p>
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

      {/* Two Halves Narrative */}
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"52px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
          <div style={{color:C.gold,fontWeight:900,fontSize:11,textTransform:"uppercase",
            letterSpacing:1,marginBottom:10}}>How Your Contribution Works Smarter</div>
          <h2 style={{color:C.white,fontSize:22,fontWeight:900,marginBottom:16,lineHeight:1.4}}>
            Every Contributed Fund in a Cell Splits Into Two — And the Second Half Splits Into Four
          </h2>
          <div className="grid-2" style={{gap:20,marginBottom:28,textAlign:"left"}}>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:14,padding:24}}>
              <div style={{fontSize:32,marginBottom:12}}>💰</div>
              <div style={{color:C.gold,fontWeight:900,fontSize:14,marginBottom:8}}>
                The First Half — Yours
              </div>
              <div style={{color:"rgba(255,255,255,.85)",fontSize:13,lineHeight:1.85}}>
                50% of every contribution made inside your cell accumulates month by month 
                over the full 10-month cycle. At the end of the cycle, this pooled amount 
                is divided equally among all 10 contributing members of that cell. 
                <strong style={{color:C.gold}}> ₦50,000 cash — returned to you directly.</strong>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:14,padding:24}}>
              <div style={{fontSize:32,marginBottom:12}}>🌊</div>
              <div style={{color:C.gold,fontWeight:900,fontSize:14,marginBottom:8}}>
                The Second Half — Amounting to Something Bigger
              </div>
              <div style={{color:"rgba(255,255,255,.85)",fontSize:13,lineHeight:1.85}}>
                The other 50% — merges with the 50% from all other cells across the entire cooperative — into a massive cooperative pool of funds. Half of that pool is used to fund <strong style={{color:C.gold}}>Approved Bill Support Requests</strong>, and the other half caters for <strong style={{color:C.gold}}>Loan Requests, Operations and Reserve.</strong>
              </div>
            </div>
          </div>

          {/* Visual flow diagram */}
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:24,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",
              gap:8,flexWrap:"wrap",fontSize:13,color:"rgba(255,255,255,.8)"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:22}}>👥</div>
                <div style={{color:C.gold,fontWeight:700,fontSize:12,marginTop:4}}>Cell A</div>
                <div style={{fontSize:11,opacity:.7}}>50% contributions</div>
              </div>
              <div style={{color:C.gold,fontSize:20,fontWeight:300}}>+</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:22}}>👥</div>
                <div style={{color:C.gold,fontWeight:700,fontSize:12,marginTop:4}}>Cell B</div>
                <div style={{fontSize:11,opacity:.7}}>50% contributions</div>
              </div>
              <div style={{color:C.gold,fontSize:20,fontWeight:300}}>+</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:22}}>👥</div>
                <div style={{color:C.gold,fontWeight:700,fontSize:12,marginTop:4}}>Cell C</div>
                <div style={{fontSize:11,opacity:.7}}>50% contributions</div>
              </div>
              <div style={{color:C.gold,fontSize:20,fontWeight:300}}>+ ···</div>
              <div style={{color:C.gold,fontSize:28,fontWeight:300}}>→</div>
              <div style={{textAlign:"center",background:"rgba(201,168,76,0.15)",
                borderRadius:12,padding:"14px 20px",border:`1.5px solid ${C.gold}44`}}>
                <div style={{fontSize:26}}>🏦</div>
                <div style={{color:C.gold,fontWeight:900,fontSize:13,marginTop:4}}>Cooperative Pool</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>
                  Bill Support · Loans · Reserve
                </div>
              </div>
            </div>
          </div>

          <div style={{background:"rgba(201,168,76,0.12)",border:`1px solid ${C.gold}44`,
            borderRadius:12,padding:18,fontSize:13,color:"rgba(255,255,255,.85)",lineHeight:1.85}}>
            <strong style={{color:C.gold}}>The result:</strong> No single cell carries the burden of bill support alone. 
            Every cell contributes its second half to a collective fund that grows with every new member, 
            every new cell, and every monthly contribution — across the entire cooperative simultaneously. 
            The more the cooperative grows, the more powerful the pool becomes — and every member 
            benefits from the collective discipline of everyone else.
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div style={{background:C.bg,padding:"48px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <span className="section-tag" style={{background:"#EFF6FF",color:C.blue}}>Payment Schedule</span>
          <h2 className="section-title">Simple. Structured. Predictable.</h2>
          <p className="section-sub">Your contribution schedule is clear from day one. One payment to activate. Then monthly contributions aligned to the calendar — with no surprises.</p>
          <div className="grid-2" style={{marginBottom:24}}>
            <div className="card" style={{borderTop:`3px solid ${C.blue}`}}>
              <div style={{fontSize:24,marginBottom:8}}>1️⃣</div>
              <div style={{fontWeight:800,color:C.blue,fontSize:14,marginBottom:8}}>First Payment — Activation</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
                Your first monthly contribution activates your membership and places you in your tier's queue. <strong>This is the only payment required until your contribution cell activates.</strong> No further payments are collected while you wait in the queue.
              </div>
            </div>
            <div className="card" style={{borderTop:`3px solid ${C.green}`}}>
              <div style={{fontSize:24,marginBottom:8}}>2️⃣</div>
              <div style={{fontWeight:800,color:C.green,fontSize:14,marginBottom:8}}>Cell Activates — Cycle Begins</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
                When 10 members queue up, your cell activates instantly. All 10 members receive an email with their Month 2 due date — the <strong>last day of the following calendar month</strong>. From that point, monthly contributions follow the calendar.
              </div>
            </div>
            <div className="card" style={{borderTop:`3px solid ${C.amber}`}}>
              <div style={{fontSize:24,marginBottom:8}}>📅</div>
              <div style={{fontWeight:800,color:C.amber,fontSize:14,marginBottom:8}}>Monthly Rhythm — Last Week / Last Day</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
                The <strong>last week of every month</strong> is your reminder window. The <strong>last day of every month</strong> is your contribution deadline. Pay before midnight on the last day to protect and grow your CoFund Credit Score.
              </div>
            </div>
            <div className="card" style={{borderTop:`3px solid ${C.burg}`}}>
              <div style={{fontSize:24,marginBottom:8}}>⚠️</div>
              <div style={{fontWeight:800,color:C.burg,fontSize:14,marginBottom:8}}>Missing the Deadline</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.8}}>
                A missed monthly payment costs you <strong>credit score points</strong> (−30 pts for Tier 1, scales with tier). Your cycle payout remains protected by the Contingency Reserve — but your credit score and loan access will be impacted until you catch up.
              </div>
            </div>
          </div>
          <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,borderRadius:14,padding:20,color:C.white,fontSize:13,lineHeight:1.9}}>
            <strong style={{color:C.gold,fontSize:14}}>Example — Cell activates in September 2026:</strong><br/>
            Month 1 (Activation) — Paid ✅<br/>
            Month 2 — Due by <strong>31st October 2026</strong><br/>
            Month 3 — Due by <strong>30th November 2026</strong><br/>
            Month 4 — Due by <strong>31st December 2026</strong><br/>
            <span style={{opacity:.7,fontSize:11}}>...continuing monthly through Month 10 → Cycle payout disbursed</span>
          </div>
        </div>
      </div>


