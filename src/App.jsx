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
    loanTerm:3, loanRate:0.04,
    billCaps:[{min:0,max:2000000,cap:100000,tier:"Bronze"},{min:2000000,max:5000000,cap:250000,tier:"Silver"},
              {min:5000000,max:10000000,cap:350000,tier:"Gold"},{min:10000000,max:Infinity,cap:500000,tier:"Platinum"}],
    pts:{contribution:20, cellActive:5, cycleContrib:100, cycleNetwork:0,
         loanRepaid:50,
         referralActivation:20, referralCycle:25, billClaim:-500, missed:-30, loanDefault:-100},
    color:"#1A4F8A", name:"₦10,000 / month",
  },
  2: {
    id:2, label:"Tier 2", monthly:50000, benefitPool:25000, billSupport:12500,
    loanFund:6250, admin:3750, contingency:2500, cyclePayout:250000,
    unlockScore:2000, billScoreMin:5000, excellentScore:5000, strongScore:3500, standardScore:2500,
    loanLimits:{excellent:3000000, strong:1800000, standard:900000, minimal:300000},
    loanTerm:6, loanRate:0.03,
    billCaps:[{min:0,max:10000000,cap:500000,tier:"Bronze"},{min:10000000,max:25000000,cap:1250000,tier:"Silver"},
              {min:25000000,max:50000000,cap:1750000,tier:"Gold"},{min:50000000,max:Infinity,cap:2500000,tier:"Platinum"}],
    pts:{contribution:100, cellActive:25, cycleContrib:500, cycleNetwork:0,
         loanRepaid:250,
         referralActivation:100, referralCycle:125, billClaim:-2500, missed:-150, loanDefault:-500},
    color:"#0B6E4F", name:"₦50,000 / month",
  },
  3: {
    id:3, label:"Tier 3", monthly:100000, benefitPool:50000, billSupport:25000,
    loanFund:12500, admin:7500, contingency:5000, cyclePayout:500000,
    unlockScore:4000, billScoreMin:10000, excellentScore:10000, strongScore:7000, standardScore:5000,
    loanLimits:{excellent:6000000, strong:3600000, standard:1800000, minimal:600000},
    loanTerm:6, loanRate:0.025,
    billCaps:[{min:0,max:20000000,cap:1000000,tier:"Bronze"},{min:20000000,max:50000000,cap:2500000,tier:"Silver"},
              {min:50000000,max:100000000,cap:3500000,tier:"Gold"},{min:100000000,max:Infinity,cap:5000000,tier:"Platinum"}],
    pts:{contribution:200, cellActive:50, cycleContrib:1000, cycleNetwork:0,
         loanRepaid:500,
         referralActivation:200, referralCycle:250, billClaim:-5000, missed:-300, loanDefault:-1000},
    color:"#7C3AED", name:"₦100,000 / month",
  },
  4: {
    id:4, label:"Tier 4", monthly:200000, benefitPool:100000, billSupport:50000,
    loanFund:25000, admin:15000, contingency:10000, cyclePayout:1000000,
    unlockScore:8000, billScoreMin:20000, excellentScore:20000, strongScore:14000, standardScore:10000,
    loanLimits:{excellent:12000000, strong:7200000, standard:3600000, minimal:1200000},
    loanTerm:8, loanRate:0.02,
    billCaps:[{min:0,max:40000000,cap:2000000,tier:"Bronze"},{min:40000000,max:100000000,cap:5000000,tier:"Silver"},
              {min:100000000,max:200000000,cap:7000000,tier:"Gold"},{min:200000000,max:Infinity,cap:10000000,tier:"Platinum"}],
    pts:{contribution:400, cellActive:100, cycleContrib:2000, cycleNetwork:0,
         loanRepaid:1000,
         referralActivation:400, referralCycle:500, billClaim:-10000, missed:-600, loanDefault:-2000},
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
  const r = (pct) => isFounding ? 0 : Math.round(t.loanRate * pct * 1000) / 10;
  if(score>=t.excellentScore) return {label:"Excellent Performance (Lowest Risk)", rate:isFounding?0:+(t.loanRate*100).toFixed(1), limit:t.loanLimits.excellent, color:C.green, term:t.loanTerm};
  if(score>=t.strongScore)    return {label:"Strong Performance (Low Risk)",       rate:isFounding?0:+(t.loanRate*100).toFixed(1), limit:t.loanLimits.strong,    color:C.blue,  term:t.loanTerm};
  if(score>=t.standardScore)  return {label:"Standard Performance (Medium Risk)",  rate:isFounding?0:+(t.loanRate*100).toFixed(1), limit:t.loanLimits.standard,  color:C.amber, term:t.loanTerm};
  return                             {label:"Minimal Performance (Higher-Risk)",   rate:isFounding?0:+(t.loanRate*100).toFixed(1), limit:t.loanLimits.minimal,   color:C.error, term:t.loanTerm};
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

  // ── Admin Founding Member — Place in Cell ────────────────────
  const handleAdminActivateFounder = async (code) => {
    // Change from admin to founding, tier 1, activate
    await supabase.from("cfb_members").update({
      member_type:"founding", contribution_tier:1,
      status:"active", activated_at:new Date().toISOString(),
      credit_score:20, months_contributed:1,
      contribution_balance:getTier(1).benefitPool,
    }).eq("link_code",code);
    // Record administrative contribution from admin fund
    await supabase.from("cfb_credit_events").insert({
      link_code:code, event_type:"contribution", points:20,
      description:"Administrative founding contribution — recorded from Admin Fund",
    });
    // Deduct from admin fund
    const adminBal = funds.administration||0;
    await supabase.from("cfb_funds").update({
      balance:Math.max(0, adminBal - getTier(1).monthly)
    }).eq("fund_type","administration");
    await loadMembers(); await loadFunds();
    showToast(`${code} activated as Founding Member (Tier 1) — Admin Fund debited ₦10,000.`);
  };

  const handleAdminPlaceInCell = async (founderCode, cellCode) => {
    // Check not already in this cell
    const cell = cells.find(c=>c.cell_code===cellCode);
    if(!cell) { showToast("Cell not found","error"); return; }
    const alreadyIn = (cell.seats||[]).some(s=>s.link_code===founderCode);
    if(alreadyIn) { showToast("Already in this cell","error"); return; }
    const seats = (cell.seats||[]).filter(s=>s.seat_type==="contributing");
    if(seats.length>=10) { showToast("Cell already has 10 contributing members","error"); return; }
    // Insert into cell
    await supabase.from("cfb_cell_members").insert({
      cell_code:cellCode, link_code:founderCode, seat_type:"contributing"
    });
    // Record administrative contribution from admin fund
    const adminBal = funds.administration||0;
    await supabase.from("cfb_funds").update({
      balance:Math.max(0, adminBal - getTier(1).monthly)
    }).eq("fund_type","administration");
    await supabase.from("cfb_contributions").insert({
      cell_code:cellCode, link_code:founderCode,
      month_number:cell.month_number||1,
      amount:getTier(1).monthly,
      benefit_pool:getTier(1).benefitPool,
      bill_support:getTier(1).billSupport,
      loan_fund:getTier(1).loanFund,
      administration:getTier(1).admin,
      contingency:getTier(1).contingency,
      status:"confirmed",
      confirmed_at:new Date().toISOString(),
      notes:"Administrative founding arrangement — debited from Admin Fund",
    });
    await supabase.from("cfb_credit_events").insert({
      link_code:founderCode, event_type:"cell_active", points:getTier(1).pts.cellActive,
      cell_code:cellCode, description:"Admin founding placement — cell participation",
    });
    await loadCells(); await loadFunds(); await loadMembers();
    // Check if cell now has 10 — auto-complete formation
    const freshCells = await loadCells();
    const freshCell = freshCells.find(c=>c.cell_code===cellCode);
    const contribSeats = (freshCell?.seats||[]).filter(s=>s.seat_type==="contributing");
    if(contribSeats.length>=10) {
      showToast(`✅ Cell ${cellCode} now has 10 members — fully formed!`);
    } else {
      showToast(`${founderCode} placed in ${cellCode}. ${10-contribSeats.length} seat(s) remaining.`);
    }
  };

  // ── Loan Recovery Functions ──────────────────────────────────
  const sendLoanReminder = async (loan, dayNum) => {
    const mem = members[loan.link_code];
    if(!mem?.email) return;
    const tone = dayNum<=1?"gentle":dayNum<=4?"firm":"urgent";
    const subjects = {gentle:"CoFundBills — Loan Repayment Reminder",
      firm:"CoFundBills — Loan Payment Overdue",
      urgent:"CoFundBills — Final Grace Period Notice"};
    const msgs = {
      gentle:`Dear ${mem.fullName},

This is a friendly reminder that your Co-Fund Loan instalment of ${fmtNGN(loan.amount/getTier(mem.contributionTier||1).loanTerm)} was due on the last day of this month.

Please make payment at your earliest convenience to avoid a credit score deduction.

Payment reference: ${loan.link_code}
CoFundBills Cooperative
+234 909 999 4816`,
      firm:`Dear ${mem.fullName},

Your Co-Fund Loan instalment is now overdue. Please make payment immediately to avoid formal default declaration.

Outstanding: ${fmtNGN(Number(loan.amount))}
Loan ID: ${loan.id}

Failure to pay within ${7-dayNum} day(s) will trigger a credit score deduction and suspension of your bill support access.

CoFundBills Cooperative
+234 909 999 4816`,
      urgent:`Dear ${mem.fullName},

FINAL NOTICE — Your Co-Fund Loan repayment grace period expires tomorrow. If payment is not received by midnight tonight, your loan will be formally declared in default.

Consequences of default:
— Credit score deduction (${Math.abs(getTier(mem.contributionTier||1).pts.loanDefault).toLocaleString()} pts)
— Bill support access suspended
— Loan flagged as defaulted on your cooperative record
— Your Next of Kin will be notified

Please contact us immediately: +234 909 999 4816

CoFundBills Cooperative`
    };
    await sendEmail({to_email:mem.email, to_name:mem.fullName,
      subject:subjects[tone], message:msgs[tone]});
    // Also notify admin
    await sendEmail({to_email:ADMIN_EMAIL, to_name:ADMIN_NAME,
      subject:`[Loan Recovery Day ${dayNum}] ${mem.fullName} — ${fmtNGN(loan.amount)}`,
      message:`Loan recovery reminder sent to ${mem.fullName} (${loan.link_code}).
Loan amount: ${fmtNGN(loan.amount)}
Day ${dayNum} of grace period.
NOK: ${mem.nokName} — ${mem.nokPhone}`});
  };

  const handleDeclareDefault = async (loanId) => {
    const loan = loans.find(l=>l.id===loanId);
    if(!loan) return;
    const mem = members[loan.link_code];
    const mTier = getTier(mem?.contributionTier||1);
    // Update loan status
    await supabase.from("cfb_loans").update({status:"defaulted",
      defaulted_at:new Date().toISOString()}).eq("id",loanId);
    // Deduct credit score
    await supabase.from("cfb_credit_events").insert({
      link_code:loan.link_code, event_type:"loan_default",
      points:mTier.pts.loanDefault,
      description:`Loan default declared — Loan ID ${loanId}`,
    });
    await supabase.from("cfb_members").update({
      credit_score:Math.max(0,(mem?.creditScore||0)+mTier.pts.loanDefault)
    }).eq("link_code",loan.link_code);
    // Notify member
    if(mem?.email) await sendEmail({
      to_email:mem.email, to_name:mem.fullName,
      subject:"CoFundBills — Loan Default Declared",
      message:`Dear ${mem.fullName},

Your Co-Fund Loan (ID: ${loanId}, Amount: ${fmtNGN(loan.amount)}) has been formally declared in default as of ${new Date().toLocaleDateString("en-NG")}.

Consequences now in effect:
— ${Math.abs(mTier.pts.loanDefault).toLocaleString()} credit score points deducted
— Bill support access suspended until loan is cleared
— Your Next of Kin (${mem.nokName}, ${mem.nokPhone}) has been notified

To resolve this, contact us immediately:
WhatsApp: +234 909 999 4816
Email: cofundbills@gmail.com

CoFundBills Cooperative`});
    // Notify NOK
    if(mem?.nokPhone) await sendEmail({
      to_email:ADMIN_EMAIL, to_name:ADMIN_NAME,
      subject:`NOK Alert — ${mem.fullName} Loan Default`,
      message:`Please contact Next of Kin for ${mem.fullName} (${loan.link_code}):

NOK Name: ${mem.nokName}
NOK Phone: ${mem.nokPhone}
NOK Relationship: ${mem.nokRelationship}

Loan amount: ${fmtNGN(loan.amount)}
Default declared: ${new Date().toLocaleDateString("en-NG")}`});
    await loadLoans(); await loadMembers();
    showToast(`Loan ${loanId} declared in default. Member notified.`);
  };

  const handleExtendLoanTerm = async (loanId, extraMonths) => {
    const loan = loans.find(l=>l.id===loanId);
    if(!loan) return;
    const newTerm = (loan.months_term||3) + extraMonths;
    const newTotal = Number(loan.amount) * (1 + Number(loan.interest_rate)/100 * newTerm);
    await supabase.from("cfb_loans").update({
      months_term:newTerm, total_repayable:newTotal,
      status:"restructured", restructured_at:new Date().toISOString(),
    }).eq("id",loanId);
    const mem = members[loan.link_code];
    if(mem?.email) await sendEmail({
      to_email:mem.email, to_name:mem.fullName,
      subject:"CoFundBills — Loan Term Restructured",
      message:`Dear ${mem.fullName},

Your Co-Fund Loan has been restructured.

New term: ${newTerm} months
New total repayable: ${fmtNGN(newTotal)}
New monthly instalment: ${fmtNGN(newTotal/newTerm)}

Please ensure payments are made by the last day of each month going forward.

CoFundBills Cooperative
+234 909 999 4816`});
    await loadLoans();
    showToast(`Loan ${loanId} restructured to ${newTerm} months.`);
  };

  const handleOffsetPayout = async (loanId, cellCode, memberCode) => {
    const loan = loans.find(l=>l.id===loanId);
    if(!loan) return;
    const outstanding = Number(loan.total_repayable) - Number(loan.amount_repaid||0);
    const mem = members[memberCode];
    const mTier = getTier(mem?.contributionTier||1);
    // Mark loan as settled via offset
    await supabase.from("cfb_loans").update({
      status:"settled_by_offset", settled_at:new Date().toISOString(),
      settlement_notes:`Offset against cycle payout from cell ${cellCode}`
    }).eq("id",loanId);
    // Record credit event — loan repaid
    await supabase.from("cfb_credit_events").insert({
      link_code:memberCode, event_type:"loan_repaid",
      points:mTier.pts.loanRepaid,
      description:`Loan settled by cycle payout offset — Cell ${cellCode}`,
    });
    await supabase.from("cfb_members").update({
      credit_score:(mem?.creditScore||0)+mTier.pts.loanRepaid
    }).eq("link_code",memberCode);
    // Notify member
    if(mem?.email) await sendEmail({
      to_email:mem.email, to_name:mem.fullName,
      subject:"CoFundBills — Loan Settled via Cycle Payout Offset",
      message:`Dear ${mem.fullName},

Your outstanding Co-Fund Loan balance of ${fmtNGN(outstanding)} has been offset against your cycle payout from cell ${cellCode}.

Your loan is now fully settled.
+${mTier.pts.loanRepaid} credit score points have been awarded.

CoFundBills Cooperative`});
    await loadLoans(); await loadMembers();
    showToast(`Loan offset against cycle payout. Loan settled.`);
  };

  const handleSuspendMember = async (code, suspend=true) => {
    await supabase.from("cfb_members").update({
      status: suspend?"suspended":"active"
    }).eq("link_code",code);
    await loadMembers();
    showToast(`${code} ${suspend?"suspended":"reinstated"}.`);
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
  Tier 1: +20 pts | Tier 2: +100 pts | Tier 3: +200 pts | Tier 4: +400 pts

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

Once unlocked, all members in the same tier get the SAME interest rate (rate is tier-based, not score-based — score only determines the loan LIMIT):
- Tier 1: 4%/month flat, 3-month term. Limits: Excellent NGN600k, Strong NGN360k, Standard NGN180k, Minimal NGN60k
- Tier 2: 3%/month flat, 6-month term. Limits: Excellent NGN3M, Strong NGN1.8M, Standard NGN900k, Minimal NGN300k
- Tier 3: 2.5%/month flat, 6-month term. Limits: Excellent NGN6M, Strong NGN3.6M, Standard NGN1.8M, Minimal NGN600k
- Tier 4: 2%/month flat, 8-month term. Limits: Excellent NGN12M, Strong NGN7.2M, Standard NGN3.6M, Minimal NGN1.2M
- Founding Members: 0% across ALL tiers — same limits apply
Repayment: Equal monthly instalments (principal + flat interest ÷ term months). Due last day of month. 7-day grace period. Default declared Day 8. On default: credit score deduction, bill support suspended, NOK notified. Cooperative can offset outstanding loan against cycle payout at cell completion.
Loans subject to fund liquidity and admin approval.

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
    ["1. Membership","Membership is open to individuals who register through the platform and activate by paying their first monthly contribution at their chosen tier. CoFundBills offers four contribution tiers: Tier 1 (₦10,000/month), Tier 2 (₦50,000/month), Tier 3 (₦100,000/month) and Tier 4 (₦200,000/month). Members may change their tier any time before their contribution cell activates. Membership is personal and non-transferable."],
    ["2. Contribution Obligation","Contributing members must pay their tier's monthly contribution for the full 10-month cycle. Tier 1: ₦10,000/month. Tier 2: ₦50,000/month. Tier 3: ₦100,000/month. Tier 4: ₦200,000/month. The first payment activates membership and joins the tier queue. No further payments are collected until the contribution cell activates. Thereafter, contributions are due by the last day of every calendar month. Failure to contribute on time results in a credit score deduction and suspends cycle payout eligibility for the defaulting member only — until arrears are cleared."],
    ["3. Contribution Cell","Members are automatically placed into a contribution cell of exactly 10 contributing members when 10 activated members of the same tier are in the queue — first activated, first placed. Tiers never mix. Tier 1 members form Tier 1 cells, Tier 2 members form Tier 2 cells, and so on. The cycle runs for 10 months from cell activation."],
    ["4. Contribution Split","Every contribution splits as follows across all tiers: Member Benefit Pool 50%, Bill Support Fund 25%, Loan Fund 12.5%, Administration 7.5%, Contingency Reserve 5%. Tier 1 (₦10,000): ₦5,000 / ₦2,500 / ₦1,250 / ₦750 / ₦500. Tier 2 (₦50,000): ₦25,000 / ₦12,500 / ₦6,250 / ₦3,750 / ₦2,500. Tier 3 (₦100,000): ₦50,000 / ₦25,000 / ₦12,500 / ₦7,500 / ₦5,000. Tier 4 (₦200,000): ₦100,000 / ₦50,000 / ₦25,000 / ₦15,000 / ₦10,000."],
    ["5. Cycle Payout","At cycle completion, each contributing member receives 50% of their total 10-month contributions as cash: Tier 1 — ₦50,000. Tier 2 — ₦250,000. Tier 3 — ₦500,000. Tier 4 — ₦1,000,000. Payouts are processed within 7 business days of cycle completion. The remaining 50% merges into the cooperative's shared pool to fund bill support, loans, operations and the contingency reserve."],
    ["5b. Founding Member Benefits","Founding Members enjoy two exclusive financial privileges: (1) Zero interest rate on all approved Co-Fund Loans — regardless of credit score category or contribution tier. (2) Exclusive quarterly share of the cooperative's loan interest revenue — 23 of every 25 quarterly slots distributed equally among all active Founding Members, and 2 slots to the cooperative's Admin. Both benefits are permanent and in addition to regular cycle payouts."],
    ["6. Referral Bonuses","Members who invite other members earn a Referral Bonus credit point when their invited member activates their membership. Points are earned at the lower of the two tiers between the inviting member and the invited member — a member cannot earn above their own contribution station. Tier 1: +20 pts per activated invitee. Tier 2: +100 pts per activated invitee. Tier 3: +200 pts per activated invitee. Tier 4: +400 pts per activated invitee. No member receives cash or guaranteed financial return for introducing another member to the cooperative."],
    ["7. CoFund Credit Score","The CoFund Credit Score is an internal cooperative participation assessment — not a deposit, share, investment or guaranteed cash entitlement. Credit scores are tier-proportional: earning rates, thresholds and loan access limits all scale with the member's contribution tier. Scores are built through timely contributions, completed cycles and referral bonuses. Deductions apply for missed contributions, loan defaults and bill support claims. The score determines loan eligibility and bill support access only."],
    ["8. Co-Fund Loan, Repayment Schedule & Recovery","Co-Fund Loans unlock at minimum credit score thresholds per tier: Tier 1 — 400 pts. Tier 2 — 2,000 pts. Tier 3 — 4,000 pts. Tier 4 — 8,000 pts. Interest rates and repayment terms: Tier 1 — 4%/month, 3-month term. Tier 2 — 3%/month, 6-month term. Tier 3 — 2.5%/month, 6-month term. Tier 4 — 2%/month, 8-month term. Founding Members — 0% across all tiers. Repayments are equal monthly instalments due by the last day of every month. A 7-day grace period applies. Default is declared on Day 8. On default: credit score deduction fires, bill support access is suspended and the member's Next of Kin is notified. The cooperative reserves the right to offset any outstanding loan balance against the member's cycle payout at cell completion. Sustained non-payment may result in loan restructuring, membership suspension and referral to Lagos State Cooperative dispute resolution mechanisms. Loans are subject to available fund liquidity and cooperative credit policy."],
    ["9. Bill Support","25% of every contribution across all tiers funds the cooperative Bill Support Pool. Bill support access unlocks at minimum credit score thresholds per tier (same as loan access thresholds). Maximum claim amounts are determined by the cooperative's live fund balance at the time of request — not the member's tier alone. Applications are subject to available fund balance and admin approval. Bill support is not an entitlement and is limited to once per 10-month cycle."],
    ["10. Payout Protection","The Contingency Reserve (5% of every contribution) exists to cover any member's missed contribution immediately, ensuring all other cell members receive their full cycle payout on time. Defaulting members face credit score deductions and cooperative disciplinary action. No other member's payout is ever reduced due to another member's default."],
    ["11. Suspension of Rights","Failure to contribute by the last day of any month suspends cycle payout eligibility for that period and triggers a credit score deduction proportional to the member's contribution tier. Sustained non-payment may result in removal from the active cell and forfeiture of accumulated benefit pool balance for that cycle."],
    ["12. No Guaranteed Returns","CoFundBills does not guarantee any return on contributions. Cycle payouts depend on the successful completion of a full 10-month contribution cycle by the member. The cooperative makes no investment promises, yield projections or fixed return commitments of any kind."],
    ["13. Governing Law","These Terms are governed by the laws of the Federal Republic of Nigeria and the Lagos State Cooperative Societies Law 2022. CoFundBills is being registered as a Multi-Purpose Cooperative Society under Lagos State law. Disputes are subject to the jurisdiction of Nigerian cooperative authorities and courts."],
    ["14. Import Ajo — Disclaimer","The Import Ajo service is a free transparency and reminder tool provided by CoFundBills Cooperative to traditional thrift contribution groups (Ajo, Esusu and similar circles) at no charge. CoFundBills Cooperative is not a party to any Import Ajo group's contribution arrangements. All contributions within an imported Ajo group are made directly between group members into the group's own nominated bank account. CoFundBills Cooperative does not collect, hold, manage, guarantee or bear any liability for funds contributed within any Import Ajo group. The platform provides administrative tools only — reminders, payment tracking and proof of payment uploads. Any disputes, defaults or losses arising within an Import Ajo group are strictly between the group's members and coordinator. CoFundBills Cooperative accepts no responsibility whatsoever for the conduct, solvency or integrity of any Import Ajo group or its members."],
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
        {[["₦10,000 to ₦200,000","Monthly Contribution"],["₦50,000 to ₦1,000,000","Cycle Payout + Credit Bonus"],["10 Months","Contribution Cycle"],["10","Members Per Cell"],["1%–4%","Loan Rate/Month"],["50%","Benefit Pool Split"]].map(([v,l])=>(
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
              {icon:"💳",title:"10 Contributing Members",desc:"Each pays their tier's monthly contribution for 10 months. At cycle end, each receives 50% of their total contributions back as cash. The other 50% goes into a deeper layer of savings by merging with the 50% from all other contribution cells across the cooperative into a massive shared pool — half of which funds Your Approved Bill Support Requests (house rent, school fees, medical bills, etc.), and the other half caters for Approved Loan Requests, Operations and Reserve.",color:C.blue},
              {icon:"🤝",title:"Referral Bonus",desc:"When you invite someone and they activate their membership through your link, you earn Referral Bonus points automatically — equivalent to the score assigned to the lower of the two tiers between you and the invited member. No seats, no chains, no limits.",color:C.green},
              {icon:"🎖️",title:"Founding Members",desc:"Personally invited by cooperative admin to establish the founding register required for cooperative registration. Founding Members contribute and participate like all regular members — with two exclusive benefits: a zero interest rate on approved loans and a share in the cooperative's quarterly loan interest revenue.",color:C.burg},
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
          <p className="section-sub">Your CoFund Credit Score is earned through disciplined participation and measured behavioural performances — not through who you invite to join the cooperative — even though referral bonuses adds up to your credit score. Better behaviour means better loan rates, higher loan limits and access to essential bill support funds. Each contribution tier has its own credit score scale — proportional to your monthly commitment.</p>

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
                    [`Loan repaid on time`,`+${t.pts.loanRepaid.toLocaleString()} pts`,"Members who repaid on time"],
                    [`Missed contribution`,`${t.pts.missed} pts`,"Defaulting Members"],
                    [`Loan default`,`${t.pts.loanDefault.toLocaleString()} pts`,"Members who defaulted on their own loan"],
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
                    {l:"Excellent Performance (Lowest Risk)",r:`${t.excellentScore.toLocaleString()}+`,rate:`${(t.loanRate*100).toFixed(1)}%/month · ${t.loanTerm} months`,limit:t.loanLimits.excellent,c:C.green},
                    {l:"Strong Performance (Low Risk)",r:`${t.strongScore.toLocaleString()}–${(t.excellentScore-1).toLocaleString()}`,rate:`${(t.loanRate*100).toFixed(1)}%/month · ${t.loanTerm} months`,limit:t.loanLimits.strong,c:C.blue},
                    {l:"Standard Performance (Medium Risk)",r:`${t.standardScore.toLocaleString()}–${(t.strongScore-1).toLocaleString()}`,rate:`${(t.loanRate*100).toFixed(1)}%/month · ${t.loanTerm} months`,limit:t.loanLimits.standard,c:C.amber},
                    {l:"Minimal Performance (Higher-Risk)",r:`Below ${t.standardScore.toLocaleString()}`,rate:`${(t.loanRate*100).toFixed(1)}%/month · ${t.loanTerm} months`,limit:t.loanLimits.minimal,c:C.error},
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
          <p className="section-sub" style={{margin:"0 auto 24px"}}>25% of every contribution funds the cooperative Bill Support Fund. Active members with a credit score from 1,000 to 4,000 credit points can apply for support for their self-selected essential bills — up to ₦500,000 per claim for Tier 1 members and up to ₦10,000,000 per claim for Tier 4 members — from the Bill Support pool — once in every 10-month cycle — subject to CoFundBills Cooperative's funding capacity tier at the point of request.</p>
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
                The other 50% — goes into a deeper layer of savings by merging with the 50% from all other cells across the entire cooperative — into a massive cooperative pool of funds. Half of that pool is used to fund <strong style={{color:C.gold}}>Approved Bill Support Requests</strong>, and the other half caters for <strong style={{color:C.gold}}>Loan Requests, Operations and Reserve.</strong>
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

          {/* Loan repayment schedule */}
          <div style={{marginTop:32}}>
            <span className="section-tag" style={{background:"#F0FDF4",color:C.green}}>Co-Fund Loan Repayment Schedule</span>
            <h3 style={{color:C.navy,fontWeight:900,fontSize:16,margin:"8px 0 6px"}}>Equal Monthly Instalments — Aligned to the Calendar</h3>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.8,marginBottom:16}}>
              Loan repayments follow the same monthly rhythm as contributions — due by the last day of every month. A 7-day grace period applies. Repayments are calculated as equal monthly instalments across the loan term.
            </p>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:C.navy,color:C.white}}>
                    {["Tier","Rate","Term","Max Loan","Monthly Instalment (Max)","Total Repayable (Max)","Grace Period"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(TIERS).map((t,i)=>{
                    const maxLoan = t.loanLimits.excellent;
                    const totalRepayable = maxLoan * (1 + t.loanRate * t.loanTerm);
                    const monthlyInstalment = totalRepayable / t.loanTerm;
                    return(
                      <tr key={t.id} style={{background:i%2===0?C.white:C.bg,borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:"10px 12px",fontWeight:800,color:t.color}}>{t.label}</td>
                        <td style={{padding:"10px 12px",color:C.navy,fontWeight:700}}>{(t.loanRate*100).toFixed(1)}%/month</td>
                        <td style={{padding:"10px 12px",color:C.muted}}>{t.loanTerm} months</td>
                        <td style={{padding:"10px 12px",color:C.navy}}>{fmtNGN(maxLoan)}</td>
                        <td style={{padding:"10px 12px",fontWeight:700,color:C.green}}>{fmtNGN(monthlyInstalment)}</td>
                        <td style={{padding:"10px 12px",color:C.navy}}>{fmtNGN(totalRepayable)}</td>
                        <td style={{padding:"10px 12px",color:C.muted}}>7 days</td>
                      </tr>
                    );
                  })}
                  <tr style={{background:"#FEF3C7",borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"10px 12px",fontWeight:800,color:C.burg}}>🎖️ Founding</td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:C.green}}>0% — All Tiers</td>
                    <td style={{padding:"10px 12px",color:C.muted}}>Same as tier</td>
                    <td style={{padding:"10px 12px",color:C.navy}}>Same as tier</td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:C.green}}>Principal ÷ term</td>
                    <td style={{padding:"10px 12px",color:C.navy}}>Principal only</td>
                    <td style={{padding:"10px 12px",color:C.muted}}>7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{marginTop:12,background:"#FEF2F2",border:`1.5px solid #FCA5A5`,borderRadius:10,padding:12,fontSize:12,color:C.error,lineHeight:1.7}}>
              ⚠️ <strong>Default rule:</strong> Payment not received within 7 days after the last day of the month constitutes a default on that instalment — triggering a credit score deduction and suspension of bill support access until the instalment is cleared.
            </div>
          </div>
        </div>
      </div>




      {/* Founder Bio */}
      <div style={{background:C.white,padding:"52px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <span className="section-tag" style={{background:"#EFF6FF",color:C.blue}}>Meet the Founder</span>
          <h2 className="section-title">Built on Trust. Driven by Purpose.</h2>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:36,alignItems:"flex-start"}} className="grid-2">
            <div style={{textAlign:"center",flexShrink:0}}>
              <div style={{width:240,height:300,borderRadius:16,overflow:"hidden",
                boxShadow:"0 8px 32px rgba(13,33,55,.15)",border:`3px solid ${C.gold}`,
                background:C.white,margin:"0 auto"}}>
                <img src={"data:image/jpeg;base64,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"}
                  alt="Ernest Igbinoba — President & Founder, CoFundBills Cooperative"
                  style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
              </div>
              <div style={{marginTop:14}}>
                <div style={{fontWeight:900,color:C.navy,fontSize:16}}>Ernest Igbinoba</div>
                <div style={{color:C.gold,fontWeight:700,fontSize:13,marginTop:2}}>President & Founder</div>
                <div style={{color:C.muted,fontSize:12,marginTop:2}}>CoFundBills Cooperative</div>
                <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
                  {["BWCG Member","UNILAG · Building · 98 Set","Lagos, Nigeria"].map(t=>(
                    <span key={t} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,
                      padding:"3px 10px",fontSize:10,color:C.muted,fontWeight:600}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{fontSize:14,color:C.dark,lineHeight:1.95,marginBottom:16}}>
                Ernest Igbinoba is a Lagos-based entrepreneur, cooperative development advocate and technology innovator with over two decades of experience spanning construction, real estate and financial services.
              </div>
              <div style={{fontSize:14,color:C.dark,lineHeight:1.95,marginBottom:16}}>
                He is the founder of <strong>SiteTech Partnership Nigeria Limited</strong> — a construction consultancy and building services firm delivering residential development, Build-and-Sell, Build-and-Lease and serviced land solutions across Lagos. He is also the founder of <strong>RoyalTech Partnership & Investment Limited</strong>, the technology and investment vehicle behind the CoFundBills Cooperative platform.
              </div>
              <div style={{fontSize:14,color:C.dark,lineHeight:1.95,marginBottom:16}}>
                Driven by a conviction that collective financial discipline can transform everyday lives, Ernest conceived and built CoFundBills — a member-owned digital cooperative that modernises the traditional thrift contribution model with cooperative law, technology and structured governance. CoFundBills is designed to give working Nigerians structured access to bill support financing, cooperative credit and disciplined savings cycles — without the risks of informal arrangements or exploitative financial products.
              </div>
              <div style={{fontSize:14,color:C.dark,lineHeight:1.95,marginBottom:20}}>
                Ernest is personally committed to the cooperative's registration as a Multi-Purpose Cooperative Society under Lagos State Cooperative Societies Law — giving CoFundBills full legal standing and permanent member protection.
              </div>
              <div style={{borderLeft:`4px solid ${C.gold}`,paddingLeft:18,marginTop:8}}>
                <div style={{fontSize:16,color:C.navy,fontStyle:"italic",fontWeight:700,lineHeight:1.7}}>
                  "Don't face bills alone. Let's co-fund them."
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:6}}>— Ernest Igbinoba, Founder</div>
              </div>
              <div style={{marginTop:20,display:"flex",gap:10,flexWrap:"wrap"}}>
                <a href="mailto:cofundbills@gmail.com" style={{display:"inline-flex",alignItems:"center",gap:6,
                  background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"7px 14px",
                  fontSize:12,color:C.navy,fontWeight:600,textDecoration:"none"}}>
                  ✉️ cofundbills@gmail.com
                </a>
                <a href="https://wa.me/2348061631222" target="_blank" rel="noopener noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:6,background:"#25D366",
                  borderRadius:20,padding:"7px 14px",fontSize:12,color:C.white,fontWeight:600,textDecoration:"none"}}>
                  💬 +234 806 163 1222
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Not a pyramid */}
      <div className="section" style={{background:C.bg}}>
        <div className="section-inner">
          <span className="section-tag" style={{background:"#FEF2F2",color:C.burg}}>Transparency & Legality</span>
          <h2 className="section-title">Why CoFundBills is NOT a Pyramid Scheme</h2>
          <p className="section-sub">CoFundBills is a registered cooperative — built on contribution discipline, not recruitment. Here is why:</p>
          <div className="grid-2">
            {[
              ["✅ No cash from recruiting","Invite links earn Referral Bonus points only — never cash. No tiered positions, no chain structure, no multi-level commissions."],
              ["✅ Works with zero new members","A cell of 10 can complete a full 10-month cycle with zero new recruitments after activation. Earnings come from contributions, not recruitment."],
              ["✅ Every naira documented","50% benefit pool, 25% bill support, 12.5% loans, 7.5% admin, 5% reserve — transparent and automatic."],
              ["✅ Behaviour-based credit","Credit score rewards contribution discipline and repayment history — not position or recruitment."],
              ["✅ Payout is guaranteed","The Contingency Reserve protects every member's cycle payout from defaults by others."],
              ["✅ Registered cooperative","Being registered as a Multi-Purpose Cooperative Society under Lagos State Cooperative Societies Law 2022."],
            ].map(([t,d])=>(
              <div key={t} className="card" style={{borderLeft:`3px solid ${C.green}`}}>
                <div style={{fontWeight:800,color:C.green,fontSize:13,marginBottom:6}}>{t}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{background:C.bg,padding:"52px 24px",textAlign:"center"}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <h2 style={{color:C.navy,fontWeight:900,fontSize:28,marginBottom:12}}>Ready to Start?</h2>
          <p style={{color:C.muted,fontSize:15,marginBottom:28,lineHeight:1.7}}>Join thousands of Nigerians building financial capacity together. Register free today — activation only when you are ready.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn btn-gold btn-lg" onClick={()=>setModal({type:"register"})}>Join Free Today</button>
            <button className="btn btn-outline btn-lg" onClick={()=>setModal({type:"login"})}>Log In to My Portal</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{background:C.navy,padding:"32px 24px",color:"rgba(255,255,255,.6)",fontSize:12,textAlign:"center"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{fontWeight:900,color:C.white,fontSize:16,marginBottom:4}}>CoFundBills Cooperative</div>
          <div style={{marginBottom:8}}>2B, Olawale Cole, Onitiri Avenue, Lekki Phase 1, Lagos · cofundbills@gmail.com · +234 806 163 1222</div>
          <div style={{marginBottom:12,opacity:.5}}>© {new Date().getFullYear()} CoFundBills Cooperative · RoyalTech Partnership & Investment Limited · All rights reserved</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <button style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:11}} onClick={()=>setTcOpen(true)}>Terms & Conditions</button>
            <button style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:11}} onClick={()=>setFaqOpen(true)}>FAQs</button>
            <button style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:11}} onClick={()=>setModal({type:"register"})}>Register</button>
          </div>
        </div>
      </div>
    </>
  );


  // ══════════════════════════════════════════════════════════════
  // ── Member Portal ─────────────────────────────────────────────
  const currentMember = member ? (members[member.linkCode]||member) : null;

  const Portal = () => {
    if(!currentMember) return null;
    const m = currentMember;
    const cat = scoreCategory(m.creditScore, m.contributionTier||1, m.memberType==="founding");
    const mTier = getTier(m.contributionTier||1);
    const myCells = cells.filter(c=>c.seats?.some(s=>s.link_code===m.linkCode));
    const myActiveCell = cells.find(c=>c.status==="active"&&c.seats?.some(s=>s.link_code===m.linkCode));
    const myLoans = loans.filter(l=>l.link_code===m.linkCode);
    const myBills = billApps.filter(b=>b.link_code===m.linkCode);
    const inviteLink = `${window.location.origin}?ref=${m.linkCode}`;
    const pendingLoans = myLoans.filter(l=>l.status==="pending");

    return (
      <div style={{minHeight:"100vh",background:C.bg}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"20px 24px",color:C.white}} className="portal-header">
          <div style={{maxWidth:860,margin:"0 auto"}}>
            <div style={{fontWeight:900,fontSize:18,marginBottom:2}}>{m.fullName}</div>
            <div style={{fontSize:12,opacity:.75,marginBottom:10}}>{m.linkCode} · {m.memberType==="founding"?"🎖️ Founding Member — Zero Interest Loans & Quarterly Interest Share":"Regular Member"}</div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:12}}>
              <span style={{background:m.status==="active"?"#BBF7D0":"#FEE2E2",color:m.status==="active"?"#166534":C.error,borderRadius:20,padding:"3px 10px",fontWeight:700,fontSize:11}}>
                {m.status==="active"?"✅ Active":"⏳ Pending"}
              </span>
              <span style={{opacity:.75}}>{cat.label} · {fmtPts(m.creditScore)}</span>
              <button className="btn btn-outline btn-sm" style={{marginLeft:"auto"}} onClick={()=>{setMember(null);setView("landing");}}>🔒 Log Out</button>
            </div>
          </div>
        </div>

        <div style={{maxWidth:860,margin:"0 auto",padding:"0 16px 40px"}}>
          <div className="portal-tabs" style={{padding:"16px 0 0"}}>
            {[["dashboard","🏠 Dashboard"],["myCell","My Cell"],["credit","Credit Score"],
              ["loan","Co-Fund Loan"],["bill","Bill Support"],["invite","📨 Invite"],["statement","Statement"]
            ].map(([k,l])=>(
              <button key={k} className={`portal-tab${portalTab===k?" active":""}`} onClick={()=>setPortalTab(k)}>{l}</button>
            ))}
          </div>

          {/* Dashboard */}
          {portalTab==="dashboard"&&(
            <div>
              {/* Countdown timer */}
              {(()=>{
                if(!myActiveCell||!myActiveCell.next_payment_deadline) return null;
                const deadline = new Date(myActiveCell.next_payment_deadline);
                deadline.setHours(23,59,59,999);
                const now = new Date(); void tick;
                const totalMs = deadline - now;
                const isOverdue = totalMs <= 0;
                const days = isOverdue ? 0 : Math.floor(totalMs/(1000*60*60*24));
                const hours = isOverdue ? 0 : Math.floor((totalMs%(1000*60*60*24))/(1000*60*60));
                const mins = isOverdue ? 0 : Math.floor((totalMs%(1000*60*60))/(1000*60));
                const urgencyColor = isOverdue?C.error:days<=3?C.error:days<=7?C.amber:C.blue;
                const cellTier = getTier(myActiveCell.contribution_tier||1);
                return(
                  <div style={{background:isOverdue?"#FEF2F2":days<=7?"#FEF3C7":"#EFF6FF",
                    border:`2px solid ${urgencyColor}`,borderRadius:14,padding:18,marginBottom:16,marginTop:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:12}}>
                      <div>
                        <div style={{fontWeight:800,color:urgencyColor,fontSize:13}}>
                          {isOverdue?"⚠️ Payment Overdue":days<=3?"🔴 Payment Due Urgently":days<=7?"🟡 Payment Due This Week":"📅 Next Contribution Due"}
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>Month {(myActiveCell.month_number||1)+1} of 10 · {fmtDate(deadline)} · {cellTier.label}</div>
                      </div>
                      <div style={{fontWeight:900,color:urgencyColor,fontSize:18}}>{fmtNGN(cellTier.monthly)}</div>
                    </div>
                    {!isOverdue&&(
                      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12}}>
                        {[["Days",days],["Hours",hours],["Minutes",mins]].map(([label,val])=>(
                          <div key={label} style={{background:urgencyColor,borderRadius:10,padding:"10px 16px",textAlign:"center",minWidth:70,flex:1}}>
                            <div style={{fontSize:28,fontWeight:900,color:C.white,lineHeight:1}}>{String(val).padStart(2,"0")}</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.8)",marginTop:3,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isOverdue&&<div style={{background:C.error,borderRadius:10,padding:"10px 16px",textAlign:"center",marginBottom:12}}>
                      <div style={{fontWeight:900,color:C.white,fontSize:14}}>Payment deadline has passed</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginTop:2}}>Contact admin immediately — WhatsApp +234 909 999 4816</div>
                    </div>}
                    <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:10,fontSize:12,lineHeight:1.8}}>
                      <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                      Zenith Bank — 1016621205 · Ref: <strong>{m.linkCode}</strong>
                    </div>
                    {!isOverdue&&<div style={{fontSize:11,color:C.muted,marginTop:8,textAlign:"center"}}>
                      Pay before midnight on {fmtDate(deadline)} to protect and grow your CoFund Credit Score
                    </div>}
                  </div>
                );
              })()}

              {/* Pending activation */}
              {m.status==="pending"&&(
                <div className="info-box">
                  <strong>🔔 Activate Your Membership</strong><br/>
                  Pay your first monthly contribution of <strong>{fmtNGN(mTier.monthly)}</strong> ({mTier.label}) to activate your membership and join the queue. This is the only payment required until your contribution cell activates.
                  <div style={{background:C.white,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:11,marginTop:10,lineHeight:1.9,fontSize:13}}>
                    <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                    Zenith Bank — 1016621205<br/>
                    Reference: <strong>{m.linkCode}</strong><br/>
                    WhatsApp: <strong>+234 909 999 4816</strong>
                  </div>
                </div>
              )}

              {/* Queue hold message */}
              {m.status==="active"&&isInQueue(m,cells)&&(
                <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:14}}>
                  <strong style={{color:"#166534"}}>✅ You are in the {mTier.label} Queue</strong><br/>
                  <div style={{fontSize:12,color:"#166534",lineHeight:1.8,marginTop:6}}>
                    Your first contribution has been received and you are now in the queue. <strong>No further payments are required until your contribution cell activates.</strong><br/>
                    When 10 members are in the {mTier.label} queue, your cell will form automatically and you will receive an email with your Month 2 payment due date.
                  </div>
                </div>
              )}

              {/* Founding member banner */}
              {m.memberType==="founding"&&(
                <div style={{background:`linear-gradient(135deg,${C.burg},#9B2335)`,borderRadius:14,padding:16,marginBottom:14,color:C.white}}>
                  <div style={{fontWeight:900,fontSize:14,marginBottom:8}}>🎖️ Founding Member Benefits</div>
                  <div style={{fontSize:13,lineHeight:1.85,opacity:.92}}>
                    As a Founding Member, you get <strong>loans at zero interest</strong>, and benefit from an <strong>exclusive quarterly share of loan interest revenue</strong> — 23 of every 25 quarterly slots distributed equally among all active Founding Members.
                  </div>
                </div>
              )}

              {/* Tier change (pre-cell) */}
              {m.status==="active"&&isInQueue(m,cells)&&(
                <div className="card" style={{marginBottom:14}}>
                  <div style={{fontWeight:700,color:C.navy,fontSize:13,marginBottom:8}}>💱 Change Contribution Tier</div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>You can change your tier any time before your cell activates. You will move to the back of the new tier's queue.</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {Object.values(TIERS).map(t=>(
                      <button key={t.id} className={`btn btn-sm ${(m.contributionTier||1)===t.id?"btn-blue":"btn-ghost"}`}
                        onClick={async()=>{
                          if((m.contributionTier||1)===t.id) return;
                          await supabase.from("cfb_members").update({contribution_tier:t.id}).eq("link_code",m.linkCode);
                          const allM = await loadMembers();
                          setMember(allM[m.linkCode]);
                          showToast(`Tier changed to ${t.label}`);
                        }}>
                        {t.label} — {fmtNGN(t.monthly)}/mo
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid-3" style={{marginBottom:16}}>
                {[
                  {l:"Contribution Balance",v:fmtNGN(m.contributionBalance),c:C.blue},
                  {l:"Credit Score",v:fmtPts(m.creditScore),c:C.gold},
                  {l:"Cycles Completed",v:m.cyclesCompleted,c:C.green},
                  {l:"Months Contributed",v:m.monthsContributed,c:C.purple},
                  {l:"Active Cells",v:myCells.filter(c=>c.status==="active").length,c:C.amber},
                  {l:"Pending Loans",v:pendingLoans.length,c:C.burg},
                ].map(s=>(
                  <div key={s.l} className="stat-card">
                    <div className="stat-val" style={{color:s.c}}>{s.v}</div>
                    <div className="stat-lbl">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Invite link */}
              {/* Queue Status — all tiers */}
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,marginBottom:4,fontSize:13}}>📊 Live Queue Status — All Tiers</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:12,lineHeight:1.6}}>
                  Each tier queue forms a new contribution cell automatically when 10 members are waiting. Choose a tier that suits your financial capacity — a fuller queue means a faster cell activation.
                </div>
                {Object.values(TIERS).map(t=>{
                  const seatedCodes = new Set(cells.flatMap(c=>(c.seats||[]).map(s=>s.link_code)));
                  const queueCount = Object.values(members).filter(mx=>
                    mx.status==="active" && (mx.contributionTier||1)===t.id &&
                    !seatedCodes.has(mx.linkCode)
                  ).length;
                  const pct = Math.round((queueCount/10)*100);
                  const barColor = queueCount>=8?C.green:queueCount>=5?C.amber:C.blue;
                  const isMyTier = (m.contributionTier||1)===t.id;
                  return(
                    <div key={t.id} style={{marginBottom:12,padding:10,borderRadius:10,
                      background:isMyTier?`${t.color}0D`:C.bg,
                      border:`1.5px solid ${isMyTier?t.color:C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:4}}>
                        <div>
                          <span style={{fontWeight:800,color:t.color,fontSize:12}}>{t.label}</span>
                          {isMyTier&&<span style={{background:t.color,color:C.white,borderRadius:20,
                            padding:"1px 7px",fontSize:9,fontWeight:700,marginLeft:6}}>YOUR TIER</span>}
                          <span style={{color:C.muted,fontSize:11,marginLeft:6}}>{t.name} · {fmtNGN(t.cyclePayout)} payout</span>
                        </div>
                        <span style={{fontWeight:900,color:barColor,fontSize:13}}>{queueCount}/10</span>
                      </div>
                      <div className="score-bar">
                        <div className="score-fill" style={{width:pct+"%",background:barColor}}/>
                      </div>
                      <div style={{fontSize:10,color:C.muted,marginTop:4}}>
                        {queueCount===0?"No members waiting yet"
                          :queueCount<5?`${queueCount} member${queueCount!==1?"s":""} waiting — early stage`
                          :queueCount<8?`${queueCount} members — growing queue`
                          :queueCount<10?`${10-queueCount} more needed — cell forming soon!`
                          :"Cell forming now!"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="card">
                <div style={{fontWeight:800,color:C.navy,marginBottom:8,fontSize:13}}>Your Co-Fund Invite Link</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:10,lineHeight:1.7}}>
                  Members who activate through your link earn you Referral Bonus points automatically — score determined by the limit of the lower of the two tiers between you and the invited member.
                </div>
                <div style={{background:C.bg,borderRadius:8,padding:10,fontSize:12,wordBreak:"break-all",marginBottom:10,border:`1px solid ${C.border}`}}>{inviteLink}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="btn btn-sm btn-blue" onClick={()=>{navigator.clipboard.writeText(inviteLink);showToast("Link copied!");}}>📋 Copy Link</button>
                  <a className="btn btn-sm btn-green" href={`https://wa.me/?text=I would like to invite you to CoFundBills Cooperative. Use my link: ${encodeURIComponent(inviteLink)}`} target="_blank" rel="noopener noreferrer">💬 Share on WhatsApp</a>
                </div>
              </div>
            </div>
          )}

          {/* My Cell */}
          {portalTab==="myCell"&&(
            <div>
              <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:14,fontSize:13,color:"#166534",lineHeight:1.8}}>
                <strong>🛡️ Your Payout is Protected</strong><br/>
                If any cell member defaults, the cooperative's Contingency Reserve covers the shortfall. Your cycle payout is guaranteed regardless of fellow members' behaviour.
              </div>
              {myCells.length===0?(
                <div className="card" style={{textAlign:"center",padding:36,color:C.muted}}>
                  {isInQueue(m,cells)
                    ? "You are in the queue. No further payments are due until your cell activates. You will receive an email when your cell is ready."
                    : "You are not yet placed in a contribution cell. Activate your membership to join the queue."}
                </div>
              ):myCells.map(c=>{
                const mySeat = c.seats?.find(s=>s.link_code===m.linkCode);
                const seatInfo = SEAT[mySeat?.seat_type]||SEAT.contributing;
                const cellTier = getTier(c.contribution_tier||1);
                const nextDeadline = c.next_payment_deadline ? new Date(c.next_payment_deadline) : null;
                const today = new Date();
                const daysLeft = nextDeadline ? Math.ceil((nextDeadline-today)/(1000*60*60*24)) : null;
                return(
                  <div key={c.cell_code}>
                    <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:8,fontSize:12,flexWrap:"wrap"}}>
                      <span style={{background:seatInfo.bg,color:C.white,borderRadius:20,padding:"3px 10px",fontWeight:700}}>{seatInfo.icon} {seatInfo.label}</span>
                      <span style={{color:C.muted}}>Cycle payout: <strong>{fmtNGN(cellTier.cyclePayout)}</strong></span>
                    </div>
                    {nextDeadline&&(
                      <div style={{background:daysLeft<=7?"#FEF2F2":daysLeft<=14?"#FEF3C7":"#EFF6FF",
                        border:`1.5px solid ${daysLeft<=7?C.error:daysLeft<=14?C.amber:C.blue}`,
                        borderRadius:10,padding:12,marginBottom:10,fontSize:12}}>
                        <div style={{fontWeight:800,color:daysLeft<=7?C.error:daysLeft<=14?"#92400E":C.blue,marginBottom:4}}>
                          {daysLeft<=0?"⚠️ Payment Overdue!":daysLeft<=7?"🔴 Payment Due This Week":daysLeft<=14?"🟡 Payment Due Soon":"📅 Next Payment Due"}
                        </div>
                        <div style={{color:C.navy,lineHeight:1.8}}>
                          Month {(c.month_number||1)+1} of 10 — Due by: <strong>{fmtDate(nextDeadline)}</strong><br/>
                          Amount: <strong>{fmtNGN(cellTier.monthly)}</strong><br/>
                          {daysLeft>0?<span style={{color:C.muted}}>{daysLeft} day{daysLeft!==1?"s":""} remaining</span>:<span style={{color:C.error}}>Missing deadline costs you {Math.abs(cellTier.pts.missed)} credit points</span>}
                        </div>
                        <div style={{marginTop:8,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:10,fontSize:12,lineHeight:1.8}}>
                          <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                          Zenith Bank — 1016621205<br/>
                          Reference: <strong>{m.linkCode}</strong>
                        </div>
                      </div>
                    )}
                    <CellVisual cell={c}/>
                  </div>
                );
              })}
            </div>
          )}

          {/* Credit Score */}
          {portalTab==="credit"&&(
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontSize:11,color:C.muted}}>{mTier.label} · Score threshold: {mTier.excellentScore.toLocaleString()} pts for Excellent</div>
                    <div style={{fontSize:36,fontWeight:900,color:C.navy,lineHeight:1}}>{m.creditScore.toLocaleString()}</div>
                    <div style={{fontWeight:700,color:cat.color,fontSize:13,marginTop:4}}>{cat.label}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>Loan rate: {cat.rate===0?"0% — Founding Member Benefit":cat.rate+"%/month"} · Max loan: {fmtNGN(cat.limit)}</div>
                  </div>
                  <div style={{width:100}}>
                    <div className="score-bar"><div className="score-fill" style={{width:Math.min(100,(m.creditScore/mTier.excellentScore)*100)+"%",background:cat.color}}/></div>
                  </div>
                </div>
              </div>
              <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:10}}>{mTier.label} — Score Thresholds & Loan Access</div>
              {[
                {l:"Excellent Performance (Lowest Risk)",s:mTier.excellentScore,r:m.memberType==="founding"?0:+(mTier.loanRate*100).toFixed(1),limit:mTier.loanLimits.excellent,c:C.green},
                {l:"Strong Performance (Low Risk)",s:mTier.strongScore,r:m.memberType==="founding"?0:+(mTier.loanRate*100).toFixed(1),limit:mTier.loanLimits.strong,c:C.blue},
                {l:"Standard Performance (Medium Risk)",s:mTier.standardScore,r:m.memberType==="founding"?0:+(mTier.loanRate*100).toFixed(1),limit:mTier.loanLimits.standard,c:C.amber},
                {l:"Minimal Performance (Higher-Risk)",s:0,r:m.memberType==="founding"?0:+(mTier.loanRate*100).toFixed(1),limit:mTier.loanLimits.minimal,c:C.error},
              ].map(cat=>(
                <div key={cat.l} style={{borderRadius:10,border:`1.5px solid ${cat.c}44`,padding:12,marginBottom:8,
                  background:cat.c+"0D",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:800,color:cat.c,fontSize:12}}>{cat.l}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{cat.s>0?cat.s.toLocaleString()+"+ pts"+(m.memberType==="founding"?" — Founding Member Benefit":""):"Below "+mTier.standardScore.toLocaleString()+" pts"+(m.memberType==="founding"?" — Founding Member Benefit":"")}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,fontWeight:700,color:cat.r===0?C.green:C.navy}}>{cat.r===0?"Zero Interest Rate — Founding Member Benefit":cat.r+"%/month"}</div>
                    <div style={{fontSize:11,color:C.muted}}>Max: {fmtNGN(cat.limit)}</div>
                  </div>
                  {m.creditScore>=cat.s&&(m.creditScore<(cat.l.includes("Excellent")?Infinity:mTier.excellentScore))&&cat.s>0&&(
                    <span style={{background:cat.c,color:C.white,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>✓ Your current category</span>
                  )}
                </div>
              ))}
              <div className="card" style={{marginTop:16}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:10}}>How to Improve Your Score</div>
                {[
                  ["Contribute on time every month",`+${mTier.pts.contribution} pts`],
                  ["Stay active in your contribution cell",`+${mTier.pts.cellActive} pts/month`],
                  ["Complete a full 10-month cycle",`+${mTier.pts.cycleContrib.toLocaleString()} pts`],
                  ["Repay loans on time",`+${mTier.pts.loanRepaid} pts per repayment`],
                  ["Invite members through your link",`Referral Bonus: +${mTier.pts.referralActivation} pts per activated member (scored at lower of both tiers)`],
                ].map(([a,b])=>(
                  <div key={a} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.bg}`,fontSize:12}}>
                    <span style={{color:C.dark}}>{a}</span>
                    <span style={{fontWeight:700,color:C.green,flexShrink:0,marginLeft:8}}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Tab */}
          {portalTab==="loan"&&(
            <div>
              {m.creditScore < mTier.unlockScore ? (
                <div className="warn-box">
                  <strong>🔒 Co-Fund Loan is not yet accessible.</strong><br/>
                  Required credit score: <strong>{mTier.unlockScore.toLocaleString()} pts minimum ({mTier.label})</strong><br/>
                  Your current score: <strong>{m.creditScore.toLocaleString()} pts</strong> — {cat.label}<br/>
                  You need <strong>{Math.max(0,mTier.unlockScore-m.creditScore).toLocaleString()} more points</strong> to unlock loan access.<br/>
                  {m.memberType==="founding"&&<div style={{color:C.green,fontWeight:700,marginTop:6,fontSize:12}}>✅ Zero interest rate on approved loans — Founding Member benefit.</div>}
                  <div style={{marginTop:8,fontSize:11,lineHeight:1.7}}>
                    Build your score through consistent contributions (+{mTier.pts.contribution} pts/month), completing cycles (+{mTier.pts.cycleContrib.toLocaleString()} pts) and referral credit bonuses (+{mTier.pts.referralActivation} pts per activated invitee).
                  </div>
                </div>
              ):(
                <div>
                  <div className="card" style={{marginBottom:14}}>
                    <div style={{fontWeight:800,color:C.navy,fontSize:14,marginBottom:4}}>Apply for a Co-Fund Loan</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Based on your CoFund Credit Score of {m.creditScore.toLocaleString()} pts ({cat.label}) · {mTier.label}</div>
                    {m.memberType==="founding"&&(
                      <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#166534",fontWeight:700}}>
                        🎖️ As a Founding Member, you get loans at zero interest, and benefit from exclusive quarterly share of loan interest revenue.
                      </div>
                    )}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
                      <div style={{textAlign:"center",padding:10,background:C.bg,borderRadius:8}}>
                        <div style={{fontWeight:900,color:cat.color,fontSize:18}}>{cat.rate===0?"0%":cat.rate+"%"}/mo</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>Interest Rate</div>
                      </div>
                      <div style={{textAlign:"center",padding:10,background:C.bg,borderRadius:8}}>
                        <div style={{fontWeight:900,color:C.navy,fontSize:18}}>{fmtNGN(cat.limit)}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>Max Loan</div>
                      </div>
                      <div style={{textAlign:"center",padding:10,background:C.bg,borderRadius:8}}>
                        <div style={{fontWeight:900,color:C.navy,fontSize:18}}>{mTier.loanTerm} months</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>Repayment Term</div>
                      </div>
                    </div>
                    {/* Repayment schedule preview */}
                    {loanForm.amount&&Number(loanForm.amount)>0&&(()=>{
                      const principal = Number(loanForm.amount);
                      const term = mTier.loanTerm;
                      const rate = m.memberType==="founding" ? 0 : mTier.loanRate;
                      const totalRepayable = principal * (1 + rate * term);
                      const monthlyPayment = totalRepayable / term;
                      const today = new Date();
                      return(
                        <div style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:10,padding:14,marginBottom:14}}>
                          <div style={{fontWeight:800,color:C.blue,fontSize:12,marginBottom:10}}>📅 Repayment Schedule</div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:8,flexWrap:"wrap",gap:4}}>
                            <span style={{color:C.muted}}>Total repayable:</span>
                            <strong style={{color:C.navy}}>{fmtNGN(totalRepayable)}</strong>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:10,flexWrap:"wrap",gap:4}}>
                            <span style={{color:C.muted}}>Monthly instalment:</span>
                            <strong style={{color:C.navy}}>{fmtNGN(monthlyPayment)}</strong>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {Array.from({length:term},(_,i)=>{
                              const dueDate = new Date(today.getFullYear(), today.getMonth()+i+1, 0);
                              return(
                                <div key={i} style={{display:"flex",justifyContent:"space-between",
                                  padding:"5px 8px",background:C.white,borderRadius:6,fontSize:11}}>
                                  <span style={{color:C.muted}}>Month {i+1} — Due {fmtDate(dueDate)}</span>
                                  <strong style={{color:C.navy}}>{fmtNGN(monthlyPayment)}</strong>
                                </div>
                              );
                            })}
                          </div>
                          <div style={{marginTop:8,fontSize:10,color:C.muted,lineHeight:1.6}}>
                            ⚠️ Grace period: 7 days after each due date. Missing a payment beyond the grace period triggers a {Math.abs(mTier.pts.missed).toLocaleString()} pt credit score deduction and default declaration.
                          </div>
                        </div>
                      );
                    })()}
                    <div className="field">
                      <label>Loan Amount (₦)</label>
                      <input type="number" placeholder={`Up to ${fmtNGN(cat.limit)}`} value={loanForm.amount} onChange={e=>setLoanForm({...loanForm,amount:e.target.value})}/>
                    </div>
                    <div className="field">
                      <label>Purpose / Bill Type</label>
                      <select value={loanForm.billType} onChange={e=>setLoanForm({...loanForm,billType:e.target.value})}>
                        <option value="">Select purpose</option>
                        {["House Rent","School Fees","Medical Bills","Electricity","Water Bills","Household Essentials","Business Capital","Other"].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Additional Details (optional)</label>
                      <input type="text" placeholder="Any additional context" value={loanForm.purpose} onChange={e=>setLoanForm({...loanForm,purpose:e.target.value})}/>
                    </div>
                    <button className="btn btn-blue" style={{width:"100%"}} onClick={handleLoanApply}>Submit Loan Application</button>
                  </div>
                  {myLoans.length>0&&(
                    <div className="table-wrap">
                      <div className="table-head">Your Loan History</div>
                      {myLoans.map(l=>(
                        <div key={l.id} className="table-row" style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                          <div><div style={{fontWeight:700}}>{fmtNGN(l.amount)}</div><div style={{fontSize:11,color:C.muted}}>{l.bill_type} · {l.credit_category}</div></div>
                          <div style={{textAlign:"right"}}>
                            <span className="pill" style={{background:l.status==="approved"?"#BBF7D0":l.status==="pending"?"#FEF3C7":"#FEE2E2",color:l.status==="approved"?"#166534":l.status==="pending"?"#92400E":C.error}}>{l.status}</span>
                            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{cat.rate===0?"0%":l.interest_rate+"%"}/mo · {fmtNGN(l.total_repayable)} total</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bill Support */}
          {portalTab==="bill"&&(
            <div>
              {(()=>{
                const bsFundKey = `bill_support_t${m.contributionTier||1}`;
                const bsFundBalance = funds[bsFundKey]||funds.bill_support||0;
                const tierCap = getBillCap(bsFundBalance, m.contributionTier||1);
                return(
                  <div>
                    <div className="card" style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                        <div>
                          <div style={{fontWeight:800,color:C.navy,fontSize:13}}>Bill Support Fund — {mTier.label}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Current fund balance</div>
                          <div style={{fontSize:24,fontWeight:900,color:C.navy,marginTop:4}}>{fmtNGN(bsFundBalance)}</div>
                        </div>
                        <div style={{textAlign:"right",background:`${tierCap.color}15`,borderRadius:10,padding:"12px 16px",border:`1.5px solid ${tierCap.color}44`}}>
                          <div style={{fontWeight:800,color:tierCap.color,fontSize:13}}>{tierCap.tier} Tier</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Max claim</div>
                          <div style={{fontWeight:900,color:C.navy,fontSize:18,marginTop:2}}>{tierCap.label}</div>
                        </div>
                      </div>
                    </div>
                    {m.creditScore < mTier.unlockScore ? (
                      <div className="warn-box">
                        <strong>🔒 Bill Support not yet accessible.</strong><br/>
                        Required: <strong>{mTier.unlockScore.toLocaleString()} pts minimum</strong> · Your score: <strong>{m.creditScore.toLocaleString()} pts</strong><br/>
                        You need <strong>{Math.max(0,mTier.unlockScore-m.creditScore).toLocaleString()} more points</strong> to unlock.
                      </div>
                    ):(
                      <div className="card" style={{marginBottom:14}}>
                        <div style={{fontWeight:800,color:C.navy,fontSize:14,marginBottom:12}}>Apply for Bill Support</div>
                        <div className="field">
                          <label>Bill Type</label>
                          <select value={billForm.billType} onChange={e=>setBillForm({...billForm,billType:e.target.value})}>
                            <option value="">Select bill type</option>
                            {["House Rent","School Fees","Medical Bills","Electricity","Water Bills","Household Essentials"].map(o=><option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Amount Requested (₦)</label>
                          <input type="number" placeholder={`Up to ${tierCap.label}`} value={billForm.amount} onChange={e=>setBillForm({...billForm,amount:e.target.value})}/>
                        </div>
                        <div className="field">
                          <label>Description</label>
                          <input type="text" placeholder="Brief description of your bill" value={billForm.description} onChange={e=>setBillForm({...billForm,description:e.target.value})}/>
                        </div>
                        <div className="warn-box" style={{fontSize:11}}>
                          ⚠️ Approving this application will deduct <strong>{Math.abs(mTier.pts.billClaim).toLocaleString()} credit points</strong> from your CoFund Credit Score. Bill support is once per 10-month cycle.
                        </div>
                        <button className="btn btn-green" style={{width:"100%"}} onClick={handleBillApply}>Submit Bill Support Application</button>
                      </div>
                    )}
                    {myBills.length>0&&(
                      <div className="table-wrap">
                        <div className="table-head">Your Bill Support History</div>
                        {myBills.map(b=>(
                          <div key={b.id} className="table-row" style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                            <div><div style={{fontWeight:700}}>{fmtNGN(b.amount_requested)}</div><div style={{fontSize:11,color:C.muted}}>{b.bill_type}</div></div>
                            <span className="pill" style={{background:b.status==="approved"?"#BBF7D0":b.status==="pending"?"#FEF3C7":"#FEE2E2",color:b.status==="approved"?"#166534":b.status==="pending"?"#92400E":C.error}}>{b.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Invite Tab */}
          {portalTab==="invite"&&(
            <div>
              <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,borderRadius:16,padding:24,marginBottom:16,color:C.white}}>
                <div style={{fontWeight:900,fontSize:16,marginBottom:8}}>📨 Your Personal Invite Link</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.85,marginBottom:14}}>
                  Members who activate through your link earn you Referral Bonus points automatically — at the lower of the two tiers between you and the invited member.
                </div>
                <div style={{background:"rgba(255,255,255,.1)",borderRadius:8,padding:10,fontSize:12,wordBreak:"break-all",marginBottom:14,color:C.gold}}>{inviteLink}</div>
                <div style={{marginBottom:14}}>
                  {[
                    {seat:"Referral Bonus — invited member activates",pts:`+${mTier.pts.referralActivation} pts`,c:C.green},
                    {seat:"Each Additional Invitee",pts:"Same credits per person",c:C.amber},
                    {seat:"No Limit",pts:"Invite as many as you want",c:C.burg},
                  ].map(s=>(
                    <div key={s.seat} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.1)",fontSize:12}}>
                      <span style={{opacity:.85}}>{s.seat}</span>
                      <span style={{fontWeight:700,color:s.c,flexShrink:0,marginLeft:8}}>{s.pts}</span>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.65)"}}>
                  Referral Credits are a marginal score bonus for growing the cooperative. Your primary credit score growth comes from consistent contributions, completed cycles and timely loan repayments.
                </div>
              </div>

              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:10}}>Your Personalised Invite Message</div>
                {(()=>{
                  const inviteText = `You are personally invited to join the CoFundBills Cooperative Membership and Monthly Contribution Scheme.

Unlike the traditional thrift contribution and savings scheme where a few friends come together to form a single circle of contributors and one friend at a time gets to receive all the contributions — till everyone gets a turn to complete a cycle — CoFundBills Multipurpose Cooperative Society Limited is a digital version that offers a far more sophisticated and advanced thrift contribution and credit system with several groups of concurrently running contribution cells.

Every contributing member of a cell contributes their tier's monthly amount for 10 months to cash out half their savings at the end of the cycle — while the other half of their joint contributions goes into a deeper layer of joint savings, merging with the halves from all other contribution cells on the platform to generate a massive cooperative pool of funds — half of which funds all Approved Bill Support Requests (house rents, children's school fees, medical bills, etc.) and the other half caters for Approved Loan Requests, Operations and Reserve.

CoFundBills offers four contribution tiers to suit your financial capacity:

— Tier 1: ₦10,000/month → ₦50,000 cycle payout
— Tier 2: ₦50,000/month → ₦250,000 cycle payout
— Tier 3: ₦100,000/month → ₦500,000 cycle payout
— Tier 4: ₦200,000/month → ₦1,000,000 cycle payout

Each tier has its own independent contribution cells — Tier 1 members form Tier 1 cells, Tier 2 members form Tier 2 cells, and so on. You choose the tier that works for you at registration and can change it any time before your cell activates.

Membership is strictly by invitation. New contribution groups form automatically when 10 members of the same tier are in the queue — first registered, first placed.

Join today at the tier that suits you best. Register now with my personal invite link and choose your preferred contribution tier:
${inviteLink}`;

                  const whatsappText = encodeURIComponent(inviteText);
                  return(
                    <div>
                      <pre style={{background:C.bg,borderRadius:8,padding:12,fontSize:11,lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:12,maxHeight:200,overflowY:"auto",border:`1px solid ${C.border}`}}>{inviteText}</pre>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <button className="btn btn-sm btn-blue" onClick={()=>{navigator.clipboard.writeText(inviteText);showToast("Message copied!");}}>📋 Copy Message</button>
                        <a className="btn btn-sm btn-green" href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer">💬 Send on WhatsApp</a>
                        <a className="btn btn-sm btn-ghost" href={`mailto:?subject=Join CoFundBills Cooperative&body=${encodeURIComponent(inviteText)}`}>✉️ Send by Email</a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Statement */}
          {portalTab==="statement"&&(
            <div>
              <div className="card">
                <div style={{fontWeight:800,color:C.navy,fontSize:14,marginBottom:14}}>Account Statement</div>
                <div className="grid-2" style={{marginBottom:16}}>
                  {[
                    {l:"Total Contributed",v:fmtNGN((m.monthsContributed||0)*(mTier.monthly))},
                    {l:"Benefit Pool Balance",v:fmtNGN(m.contributionBalance)},
                    {l:"Cycles Completed",v:m.cyclesCompleted},
                    {l:"Total Paid Out",v:fmtNGN((m.cyclesCompleted||0)*mTier.cyclePayout)},
                    {l:"Credit Score",v:fmtPts(m.creditScore)},
                    {l:"Member Since",v:m.joinedAt?new Date(m.joinedAt).toLocaleDateString("en-NG"):"—"},
                  ].map(s=>(
                    <div key={s.l} style={{padding:12,background:C.bg,borderRadius:8}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{s.l}</div>
                      <div style={{fontWeight:900,color:C.navy,fontSize:15}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>
                  <strong>Member:</strong> {m.fullName} · {m.linkCode}<br/>
                  <strong>Email:</strong> {m.email}<br/>
                  <strong>Phone:</strong> {m.phone}<br/>
                  <strong>Tier:</strong> {mTier.label} — {mTier.name}<br/>
                  <strong>Status:</strong> {m.status} · {m.memberType}<br/>
                  <strong>Bank:</strong> {m.bankName} · {m.accountName} · {m.accountNumber}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // ── Admin Dashboard ───────────────────────────────────────────
  const Admin = () => {
    const allMembersList = Object.values(members);
    const pendingMembers = allMembersList.filter(m=>m.status==="pending");
    const activeMembers = allMembersList.filter(m=>m.status==="active");
    const activeCells = cells.filter(c=>c.status==="active");
    const completedCells = cells.filter(c=>c.status==="completed");
    const pendingLoans = loans.filter(l=>l.status==="pending");
    const pendingBills = billApps.filter(b=>b.status==="pending");

    const queueCount = (tierNum) => Object.values(members).filter(m=>
      m.status==="active" && (m.contributionTier||1)===tierNum &&
      !cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode))
    ).length;

    return(
      <div style={{minHeight:"100vh",background:C.bg}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"18px 24px",color:C.white,
          display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{fontWeight:900,fontSize:18}}>🛡️ CoFundBills Admin Dashboard</div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-outline btn-sm" onClick={async()=>{
              const today = new Date();
              const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
              const daysLeft = Math.ceil((lastDayOfMonth-today)/(1000*60*60*24));
              let sent = 0;
              for(const cell of cells.filter(c=>c.status==="active")){
                const t = getTier(cell.contribution_tier||1);
                for(const seat of (cell.seats||[]).filter(s=>s.seat_type==="contributing")){
                  const mem = members[seat.link_code];
                  if(mem?.email){
                    await sendEmail({
                      to_email:mem.email, to_name:mem.fullName,
                      subject:`CoFundBills — Monthly Contribution Reminder`,
                      message:`Dear ${mem.fullName},

This is your monthly contribution reminder for your CoFundBills ${t.label} contribution cell (${cell.cell_code}).

Month ${cell.month_number||1} of 10
Amount Due: ${fmtNGN(t.monthly)}
Deadline: Last day of this month (${fmtDate(lastDayOfMonth)})
${daysLeft<=7?"⚠️ URGENT: Only "+daysLeft+" day(s) remaining!":""}

Payment Details:
Account Name: Royal Tech Partnership & Investment Limited
Bank: Zenith Bank
Account Number: 1016621205
Reference: ${mem.linkCode}

After payment, send proof via WhatsApp to +234 909 999 4816.

Missing the deadline costs you ${Math.abs(t.pts.missed)} CoFund Credit Score points.

CoFundBills Cooperative
+234 806 163 1222 | +234 909 999 4816`,
                    });
                    sent++;
                  }
                }
              }
              showToast(`Monthly reminders sent to ${sent} members.`);
            }}>📧 Send Monthly Reminders</button>
            <button className="btn btn-outline btn-sm" onClick={()=>setView("landing")}>🏠 Home</button>
          </div>
        </div>

        <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px"}}>
          {/* Stats */}
          <div className="grid-4" style={{marginBottom:20}}>
            {[
              ["Queue T1",queueCount(1)+" waiting"],
              ["Queue T2",queueCount(2)+" waiting"],
              ["Queue T3",queueCount(3)+" waiting"],
              ["Queue T4",queueCount(4)+" waiting"],
              ["Active Cells",activeCells.length],
              ["Completed Cells",completedCells.length],["Pending Loans",pendingLoans.length],
              ["Pending Bills",pendingBills.length],["Total Members",allMembersList.length],
              ["Pending Activation",pendingMembers.length],
            ].map(([l,v])=>(
              <div key={l} className="stat-card"><div className="stat-val">{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>

          {/* Admin tabs */}
          <div className="portal-tabs" style={{marginBottom:16}}>
            {[["members","Members"],["pending","Pending"],["cells","Cells"],["loans","Loans"],["bills","Bills"],["analytics","Analytics"]].map(([k,l])=>(
              <button key={k} className={`portal-tab${adminTab===k?" active":""}`} onClick={()=>setAdminTab(k)}>{l}</button>
            ))}
          </div>

          {/* Members tab */}
          {adminTab==="members"&&(
            <div className="table-wrap">
              <div className="table-head">All Members ({allMembersList.length})</div>
              {allMembersList.map(m=>(
                <div key={m.linkCode} className="table-row">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontWeight:700,color:C.navy}}>{m.fullName}</div>
                      <div style={{fontSize:11,color:C.muted}}>{m.email}</div>
                      <div style={{fontSize:11,color:C.muted}}>{m.linkCode}</div>
                    </div>
                    <div style={{textAlign:"right",fontSize:12}}>
                      <div>{m.memberType} · {getTier(m.contributionTier||1).label}</div>
                      <div style={{color:C.muted}}>{m.creditScore} pts · {m.cyclesCompleted} cycles</div>
                      <span className="pill" style={{background:m.status==="active"?"#BBF7D0":"#FEE2E2",color:m.status==="active"?"#166534":C.error}}>{m.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending tab */}
          {adminTab==="pending"&&(
            <div className="table-wrap">
              {/* Admin Founding Member Controls */}
              {(()=>{
                const adminFounders = Object.values(members).filter(m=>
                  (m.memberType==="admin"||m.linkCode==="CFB-FM-0001"||m.linkCode==="CFB-FM-0002")
                  && m.status==="active" && m.memberType==="admin"
                );
                const activeCellsList = cells.filter(c=>c.status==="active");
                if(adminFounders.length===0) return null;
                return(
                  <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:12,padding:16,marginBottom:16}}>
                    <div style={{fontWeight:900,color:"#92400E",fontSize:14,marginBottom:12}}>🎖️ Admin Founding Member Controls</div>
                    {adminFounders.map(af=>(
                      <div key={af.linkCode} style={{background:C.white,borderRadius:10,padding:12,marginBottom:10,border:`1px solid ${C.border}`}}>
                        <div style={{fontWeight:700,color:C.navy,marginBottom:8}}>{af.fullName} — {af.linkCode} ({af.memberType} · {getTier(af.contributionTier||1).label})</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                          <button className="btn btn-sm btn-gold" onClick={()=>handleAdminActivateFounder(af.linkCode)}>
                            🎖️ Convert to Founding Member (Tier 1)
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Place founding members in queues with 8 or 9 members */}
                    {(()=>{
                      const founders = Object.values(members).filter(m=>
                        (m.linkCode==="CFB-FM-0001"||m.linkCode==="CFB-FM-0002") && m.status==="active" && m.memberType==="founding"
                      );
                      if(founders.length===0) return null;

                      // Find queues with 8 or 9 members (not yet in a cell)
                      const seatedCodes = new Set(cells.flatMap(c=>(c.seats||[]).map(s=>s.link_code)));
                      const readyQueues = [1,2,3,4].map(tierNum=>{
                        const queue = Object.values(members).filter(m=>
                          m.status==="active" && m.memberType!=="admin" &&
                          (m.contributionTier||1)===tierNum &&
                          !seatedCodes.has(m.linkCode)
                        );
                        return {tierNum, count:queue.length};
                      }).filter(q=>q.count>=8&&q.count<=9);

                      if(readyQueues.length===0) return null;

                      return(
                        <div style={{marginTop:12,background:"#FEF9EC",border:"1.5px solid #FCD34D",borderRadius:10,padding:14}}>
                          <div style={{fontWeight:800,color:"#92400E",fontSize:13,marginBottom:4}}>⚡ Queue Ready for Acceleration</div>
                          <div style={{fontSize:12,color:"#92400E",marginBottom:12,lineHeight:1.7}}>
                            One or more tier queues have 8–9 members. You can place founding admin members to complete the cell of 10.
                          </div>
                          {readyQueues.map(q=>(
                            <div key={q.tierNum} style={{background:C.white,borderRadius:10,padding:12,marginBottom:10,border:`1px solid ${C.border}`}}>
                              <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:8}}>
                                Tier {q.tierNum} Queue — {q.count}/10 members
                                <span style={{marginLeft:8,background:q.count===9?C.green:C.amber,color:C.white,
                                  borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>
                                  {10-q.count} slot{10-q.count!==1?"s":""} remaining
                                </span>
                              </div>
                              <div style={{fontSize:12,color:C.muted,marginBottom:10}}>
                                {q.count===9
                                  ? "Place Ernest (CFB-FM-0001) to complete this cell"
                                  : "Place Ernest and Adeyinka to complete this cell"}
                              </div>
                              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                {founders
                                  .filter(f=>!(f.linkCode==="CFB-FM-0002"&&q.count===9))
                                  .map(f=>(
                                  <button key={f.linkCode} className="btn btn-sm btn-green"
                                    onClick={async()=>{
                                      // Place in queue by changing their tier and triggering cell formation
                                      await supabase.from("cfb_members").update({contribution_tier:q.tierNum}).eq("link_code",f.linkCode);
                                      // Record admin fund debit
                                      const adminBal = funds.administration||0;
                                      const t = getTier(q.tierNum);
                                      await supabase.from("cfb_funds").update({
                                        balance:Math.max(0,adminBal-t.monthly)
                                      }).eq("fund_type","administration");
                                      await supabase.from("cfb_credit_events").insert({
                                        link_code:f.linkCode, event_type:"contribution",
                                        points:t.pts.contribution,
                                        description:`Admin founding placement — Tier ${q.tierNum} queue · Admin Fund debited ${fmtNGN(t.monthly)}`,
                                      });
                                      await supabase.from("cfb_members").update({
                                        credit_score:(members[f.linkCode]?.creditScore||0)+t.pts.contribution,
                                        months_contributed:(members[f.linkCode]?.monthsContributed||0)+1,
                                        contribution_balance:(members[f.linkCode]?.contributionBalance||0)+t.benefitPool,
                                      }).eq("link_code",f.linkCode);
                                      const allM = await loadMembers();
                                      await loadFunds();
                                      await tryFormCell(allM);
                                      // Reset tier to 4 after placement so they don't sit in any queue
                                      await supabase.from("cfb_members").update({contribution_tier:4}).eq("link_code",f.linkCode);
                                      await loadMembers();
                                      showToast(`${f.fullName} placed in Tier ${q.tierNum} queue — Admin Fund debited ${fmtNGN(t.monthly)}.`);
                                    }}>
                                    ➕ Place {f.fullName.split(" ")[1]||f.fullName} in Tier {q.tierNum}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              <div className="table-head">Pending Activation ({pendingMembers.length})</div>
              {pendingMembers.map(m=>(
                <div key={m.linkCode} className="table-row">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontWeight:700,color:C.navy}}>{m.fullName}</div>
                      <div style={{fontSize:11,color:C.muted}}>{m.email} · {m.phone}</div>
                      <div style={{fontSize:11,color:C.muted}}>{m.linkCode} · {getTier(m.contributionTier||1).label}{m.refCode==="CFB-FM-INVITE"&&<span style={{background:"#7B1D1D",color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,marginLeft:6}}>🎖️ FM Invite</span>}</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {m.refCode==="CFB-FM-INVITE"&&m.memberType!=="founding"&&(
                        <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#92400E",fontWeight:700,marginBottom:4,width:"100%"}}>
                          ⚠️ Founding Member Invite — upgrade before activating
                        </div>
                      )}
                      <button className="btn btn-sm btn-gold" onClick={()=>handleMakeFounding(m.linkCode)}>🎖️ Make Founding</button>
                      <button className="btn btn-sm btn-green" onClick={()=>handleActivate(m.linkCode)}>✅ Activate</button>
                      {m.status==="suspended"
                        ?<button className="btn btn-sm btn-green" onClick={()=>handleSuspendMember(m.linkCode,false)}>🔓 Reinstate</button>
                        :m.status==="active"&&<button className="btn btn-sm" style={{background:"#FEE2E2",color:C.error}} onClick={()=>handleSuspendMember(m.linkCode,true)}>🔒 Suspend</button>
                      }
                      <button className="btn-danger" onClick={async()=>{await supabase.from("cfb_members").delete().eq("link_code",m.linkCode);await loadMembers();showToast("Member deleted.");}}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
              {pendingMembers.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted}}>No pending members</div>}
            </div>
          )}

          {/* Cells tab */}
          {adminTab==="cells"&&(
            <div>
              {cells.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted}}>No cells yet</div>}
              {cells.map(c=>(
                <div key={c.cell_code} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
                    <div>
                      <span style={{fontWeight:800,color:C.navy}}>{c.cell_code}</span>
                      <span style={{fontSize:11,color:C.muted,marginLeft:8}}>· {getTier(c.contribution_tier||1).label} · Month {c.month_number||0}/{CYCLE_MONTHS}</span>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {c.status==="active"&&(
                        <button className="btn btn-sm btn-blue" onClick={async()=>{
                          const newMonth = (c.month_number||0)+1;
                          await supabase.from("cfb_cells").update({month_number:newMonth}).eq("cell_code",c.cell_code);
                          await loadCells();showToast("Month advanced.");
                        }}>Advance Month</button>
                      )}
                      {c.status==="active"&&(
                        <button className="btn btn-sm btn-green" onClick={()=>completeCycle(c.cell_code,c.seats||[])}>Complete Cycle</button>
                      )}
                    </div>
                  </div>
                  <CellVisual cell={c}/>
                </div>
              ))}
            </div>
          )}

          {/* Loans tab */}
          {adminTab==="loans"&&(
            <div>
              <div className="table-wrap">
                <div className="table-head">All Loans ({loans.length})</div>
                {loans.map(l=>{
                  const mem = members[l.link_code];
                  const mTier = getTier(mem?.contributionTier||1);
                  const monthlyInstalment = Number(l.total_repayable)/Number(l.months_term||mTier.loanTerm);
                  const isOverdue = l.status==="approved"&&new Date(l.approved_at)<new Date(Date.now()-30*24*60*60*1000);
                  const memberCells = cells.filter(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===l.link_code));
                  return(
                    <div key={l.id} className="table-row">
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,color:C.navy}}>{mem?.fullName||l.link_code}</div>
                          <div style={{fontSize:11,color:C.muted}}>{l.link_code} · {l.bill_type} · {l.credit_category}</div>
                          <div style={{fontSize:11,color:C.muted}}>{fmtNGN(l.amount)} principal · {l.interest_rate}%/mo · {fmtNGN(l.total_repayable)} total · {l.months_term||mTier.loanTerm} months</div>
                          <div style={{fontSize:11,color:C.muted}}>Monthly instalment: <strong>{fmtNGN(monthlyInstalment)}</strong></div>
                          {mem&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>NOK: {mem.nokName} · {mem.nokPhone}</div>}
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-start",flexDirection:"column"}}>
                          <span className="pill" style={{background:
                            l.status==="approved"?"#BBF7D0":l.status==="pending"?"#FEF3C7":
                            l.status==="defaulted"?"#FEE2E2":l.status==="restructured"?"#EDE9FE":
                            l.status==="settled_by_offset"?"#DCFCE7":"#F3F4F6",
                            color:l.status==="approved"?"#166534":l.status==="pending"?"#92400E":
                            l.status==="defaulted"?C.error:l.status==="restructured"?"#5B21B6":
                            l.status==="settled_by_offset"?"#166534":C.muted}}>
                            {l.status}
                          </span>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                            {l.status==="pending"&&<>
                              <button className="btn btn-sm btn-green" onClick={async()=>{
                                await supabase.from("cfb_loans").update({status:"approved",approved_at:new Date().toISOString()}).eq("id",l.id);
                                await loadLoans();showToast("Loan approved.");
                              }}>✅ Approve</button>
                              <button className="btn btn-sm" style={{background:"#FEE2E2",color:C.error}} onClick={async()=>{
                                await supabase.from("cfb_loans").update({status:"rejected"}).eq("id",l.id);
                                await loadLoans();showToast("Loan rejected.");
                              }}>✗ Reject</button>
                            </>}
                            {(l.status==="approved"||l.status==="restructured")&&<>
                              <button className="btn btn-sm" style={{background:"#FEF3C7",color:"#92400E"}}
                                onClick={()=>sendLoanReminder(l,1)}>📧 Day 1 Reminder</button>
                              <button className="btn btn-sm" style={{background:"#FED7AA",color:"#92400E"}}
                                onClick={()=>sendLoanReminder(l,4)}>📧 Day 4 Notice</button>
                              <button className="btn btn-sm" style={{background:"#FEE2E2",color:C.error}}
                                onClick={()=>sendLoanReminder(l,7)}>📧 Final Notice</button>
                              <button className="btn btn-sm" style={{background:C.error,color:C.white}}
                                onClick={()=>handleDeclareDefault(l.id)}>⚠️ Declare Default</button>
                              <button className="btn btn-sm" style={{background:"#EDE9FE",color:"#5B21B6"}}
                                onClick={()=>handleExtendLoanTerm(l.id,2)}>🔄 Extend +2mo</button>
                              {memberCells.length>0&&<button className="btn btn-sm btn-green"
                                onClick={()=>handleOffsetPayout(l.id,memberCells[0].cell_code,l.link_code)}>
                                💰 Offset Payout</button>}
                            </>}
                            {l.status==="defaulted"&&<>
                              <button className="btn btn-sm" style={{background:"#EDE9FE",color:"#5B21B6"}}
                                onClick={()=>handleExtendLoanTerm(l.id,2)}>🔄 Restructure</button>
                              {memberCells.length>0&&<button className="btn btn-sm btn-green"
                                onClick={()=>handleOffsetPayout(l.id,memberCells[0].cell_code,l.link_code)}>
                                💰 Offset Payout</button>}
                              <button className="btn btn-sm" style={{background:"#FEE2E2",color:C.error}}
                                onClick={()=>handleSuspendMember(l.link_code,true)}>🔒 Suspend Member</button>
                            </>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loans.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted}}>No loans yet</div>}
              </div>
            </div>
          )}

          {/* Bills tab */}
          {adminTab==="bills"&&(
            <div className="table-wrap">
              <div className="table-head">Bill Support Applications ({billApps.length})</div>
              {billApps.map(b=>(
                <div key={b.id} className="table-row">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontWeight:700}}>{members[b.link_code]?.fullName||b.link_code}</div>
                      <div style={{fontSize:11,color:C.muted}}>{fmtNGN(b.amount_requested)} · {b.bill_type}</div>
                      <div style={{fontSize:11,color:C.muted}}>{b.description}</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <span className="pill" style={{background:b.status==="approved"?"#BBF7D0":b.status==="pending"?"#FEF3C7":"#FEE2E2",color:b.status==="approved"?"#166534":b.status==="pending"?"#92400E":C.error}}>{b.status}</span>
                      {b.status==="pending"&&(
                        <>
                          <button className="btn btn-sm btn-green" onClick={async()=>{
                            await supabase.from("cfb_bill_support").update({status:"approved",approved_at:new Date().toISOString()}).eq("id",b.id);
                            const mem = members[b.link_code];
                            if(mem){
                              const mT = getTier(mem.contributionTier||1);
                              await supabase.from("cfb_members").update({credit_score:Math.max(0,(mem.creditScore||0)+mT.pts.billClaim)}).eq("link_code",b.link_code);
                            }
                            await loadBillApps();await loadMembers();showToast("Bill support approved.");
                          }}>✅ Approve</button>
                          <button className="btn btn-sm" style={{background:"#FEE2E2",color:C.error}} onClick={async()=>{await supabase.from("cfb_bill_support").update({status:"rejected"}).eq("id",b.id);await loadBillApps();showToast("Application rejected.");}}>✗ Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {billApps.length===0&&<div style={{padding:24,textAlign:"center",color:C.muted}}>No bill applications yet</div>}
            </div>
          )}

          {/* Analytics */}
          {adminTab==="analytics"&&(
            <div>
              {/* Membership & Cells */}
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:12}}>📊 Membership & Cell Activity</div>
                <div className="grid-4">
                  {[
                    {l:"Total Members",v:allMembersList.length,c:C.blue},
                    {l:"Active Members",v:activeMembers.length,c:C.green},
                    {l:"Pending Activation",v:pendingMembers.length,c:C.amber},
                    {l:"Founding Members",v:allMembersList.filter(m=>m.memberType==="founding").length,c:C.burg},
                    {l:"Active Cells",v:activeCells.length,c:C.blue},
                    {l:"Completed Cycles",v:completedCells.length,c:C.green},
                    {l:"Total Seats Filled",v:cells.reduce((a,c)=>(a+(c.seats||[]).filter(s=>s.seat_type==="contributing").length),0),c:C.purple},
                    {l:"Queue T1",v:Object.values(members).filter(m=>m.status==="active"&&(m.contributionTier||1)===1&&!cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode))).length+" waiting",c:C.amber},
                  ].map(s=>(
                    <div key={s.l} style={{padding:12,background:C.bg,borderRadius:8,borderLeft:`3px solid ${s.c}`}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{s.l}</div>
                      <div style={{fontWeight:900,color:s.c,fontSize:16}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:12}}>💰 Financial Summary</div>
                <div className="grid-2">
                  {[
                    {l:"Total Contributions Received (confirmed)",v:fmtNGN(Object.values(members).reduce((a,m)=>(a+(m.monthsContributed||0)*getTier(m.contributionTier||1).monthly),0)),c:C.blue},
                    {l:"Total Cycle Payouts",v:fmtNGN(Object.values(members).reduce((a,m)=>(a+(m.cyclesCompleted||0)*getTier(m.contributionTier||1).cyclePayout),0)),c:C.green},
                    {l:"Total Loans Outstanding",v:fmtNGN(loans.filter(l=>l.status==="approved").reduce((a,l)=>(a+Number(l.amount)),0)),c:C.purple},
                    {l:"Total Loan Interest Revenue",v:fmtNGN(loans.filter(l=>l.status==="approved").reduce((a,l)=>(a+Number(l.total_repayable)-Number(l.amount)),0)),c:C.amber},
                    {l:"Total Bill Support Paid Out",v:fmtNGN(billApps.filter(b=>b.status==="approved").reduce((a,b)=>(a+Number(b.amount_requested)),0)),c:C.burg},
                    {l:"Pending Loan Applications",v:fmtNGN(loans.filter(l=>l.status==="pending").reduce((a,l)=>(a+Number(l.amount)),0)),c:C.muted},
                  ].map(s=>(
                    <div key={s.l} style={{padding:14,background:C.bg,borderRadius:8,borderLeft:`3px solid ${s.c}`}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{s.l}</div>
                      <div style={{fontWeight:900,color:s.c,fontSize:17}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fund Balances — All Tiers */}
              <div className="card">
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:12}}>🏦 Cooperative Fund Balances</div>
                <div className="grid-2">
                  {[
                    {l:"Bill Support Fund — Tier 1",v:fmtNGN(funds.bill_support_t1||funds.bill_support||0),c:C.green},
                    {l:"Bill Support Fund — Tier 2",v:fmtNGN(funds.bill_support_t2||0),c:C.green},
                    {l:"Bill Support Fund — Tier 3",v:fmtNGN(funds.bill_support_t3||0),c:C.green},
                    {l:"Bill Support Fund — Tier 4",v:fmtNGN(funds.bill_support_t4||0),c:C.green},
                    {l:"Loan Fund",v:fmtNGN(funds.loan_fund||0),c:C.blue},
                    {l:"Loan Fund — Tier 2",v:fmtNGN(funds.loan_fund_t2||0),c:C.blue},
                    {l:"Loan Fund — Tier 3",v:fmtNGN(funds.loan_fund_t3||0),c:C.blue},
                    {l:"Loan Fund — Tier 4",v:fmtNGN(funds.loan_fund_t4||0),c:C.blue},
                    {l:"Administration Fund",v:fmtNGN(funds.administration||0),c:C.amber},
                    {l:"Contingency Reserve",v:fmtNGN(funds.contingency||0),c:C.burg},
                  ].map(s=>(
                    <div key={s.l} style={{padding:12,background:C.bg,borderRadius:8,borderLeft:`3px solid ${s.c}`}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:2}}>{s.l}</div>
                      <div style={{fontWeight:900,color:s.c,fontSize:15}}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:8,padding:12,fontSize:12,color:C.blue,lineHeight:1.7}}>
                  ℹ️ <strong>Fund balance note:</strong> Cooperative funds are credited from the contribution split when monthly contributions are recorded against active cells (from Month 2 onwards). First activation payments join the queue and do not yet split into funds. Balances will grow once cells activate and monthly contributions begin.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Referral Bonus ──────────────────────────────────────────────
  const awardReferralBonus = async (inviterCode, inviterTier, eventType, inviteeTier=1) => {
    if(!inviterCode) return;
    const inviter = members[inviterCode];
    if(!inviter || inviter.memberType==="admin") return;
    const effectiveTierNum = Math.min(inviterTier||1, inviteeTier||1);
    const t = getTier(effectiveTierNum);
    const pts = t.pts.referralActivation; // activation only — no cycle bonus
    if(!pts) return;
    await supabase.from("cfb_credit_events").insert({
      link_code:inviterCode, event_type:`referral_bonus_${eventType}`,
      points:pts, description:`Referral Bonus — invitee ${eventType}`,
    });
    await supabase.from("cfb_members").update({
      credit_score: Math.max(0,(inviter.creditScore||0)+pts)
    }).eq("link_code",inviterCode);
  };

  // ── Try to form a cell ──────────────────────────────────────────
  const tryFormCell = async (allMembers) => {
    for(const tierNum of [1,2,3,4]) {
      const {data:seated} = await supabase.from("cfb_cell_members").select("link_code");
      const seatedCodes = new Set((seated||[]).map(s=>s.link_code));
      const queue = Object.values(allMembers).filter(m=>
        m.status==="active" &&
        m.memberType!=="admin" &&
        (m.contributionTier||1)===tierNum &&
        !seatedCodes.has(m.linkCode)
      ).sort((a,b)=>new Date(a.activatedAt)-new Date(b.activatedAt));

      if(queue.length>=10){
        const ten = queue.slice(0,10);
        const cellCode = genCode("CELL-");
        const now = new Date();
        const activationMonth = now.toISOString().slice(0,7);
        const nextDeadline = new Date(now.getFullYear(), now.getMonth()+2, 0);
        const nextDeadlineStr = nextDeadline.toISOString().slice(0,10);
        await supabase.from("cfb_cells").insert({
          cell_code:cellCode, status:"active",
          contribution_tier:tierNum,
          started_at:now.toISOString(), month_number:1,
          activation_month:activationMonth,
          next_payment_deadline:nextDeadlineStr,
        });
        for(const m of ten){
          await supabase.from("cfb_cell_members").insert({
            cell_code:cellCode, link_code:m.linkCode, seat_type:"contributing"
          });
        }
        const t = getTier(tierNum);
        for(const m of ten){
          if(m.email) {
            await sendEmail({
              to_email:m.email, to_name:m.fullName,
              subject:`CoFundBills — Your Contribution Cell is Now Active!`,
              message:`Dear ${m.fullName},

Great news! Your CoFundBills ${t.label} contribution cell has been formed and is now active.

Cell Code: ${cellCode}
Tier: ${t.label} (${t.name})
Cell Members: 10 contributing members

YOUR PAYMENT SCHEDULE:
Month 1 (your activation payment) — Already paid ✅
Month 2 — Due by: ${fmtDate(nextDeadline)}

Monthly contributions of ${fmtNGN(t.monthly)} are due by the last day of each month. The last week of each month is your reminder window. Missing the deadline costs you ${Math.abs(t.pts.missed)} credit score points.

Your cycle payout of ${fmtNGN(t.cyclePayout)} will be disbursed at the end of Month 10.

Log in to track your cell progress: cofundbills.vercel.app
Questions? WhatsApp +234 909 999 4816

Warm regards,
CoFundBills Cooperative`,
            });
          }
        }
        await loadCells();
        showToast(`Tier ${tierNum} cell ${cellCode} formed with 10 members!`);
      }
    }
  };

  // ── Modal renderer ────────────────────────────────────────────
  const renderModal = () => {
    if(!modal) return null;
    const close = () => setModal(null);

    if(modal.type==="register") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)close();}}>
        <div className="modal">
          <div className="modal-hdr">
            <div className="modal-title">Join CoFundBills Cooperative</div>
            <div className="modal-sub">Free registration · No commitment until your first payment</div>
          </div>
          <div className="modal-body">
            <div className="field"><label>Contribution Tier</label>
              <select value={regForm.contributionTier} onChange={e=>setRegForm({...regForm,contributionTier:Number(e.target.value)})}>
                {Object.values(TIERS).map(t=><option key={t.id} value={t.id}>{t.label} — {t.name} (Cycle payout: {fmtNGN(t.cyclePayout)})</option>)}
              </select>
            </div>
            <div style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:10,padding:12,marginBottom:12,fontSize:12,lineHeight:1.9}}>
              <strong style={{color:C.navy,display:"block",marginBottom:4}}>Where your contributions go:</strong>
              💰 <strong>First Half — {fmtNGN(getTier(regForm.contributionTier||1).benefitPool)}/month</strong> stays in your cell → returned as <strong>{fmtNGN(getTier(regForm.contributionTier||1).cyclePayout)} cash</strong> at the end of your 10-month cycle<br/>
              🌊 <strong>Second Half — {fmtNGN(getTier(regForm.contributionTier||1).monthly - getTier(regForm.contributionTier||1).benefitPool)}/month</strong> merges with all other cells into the cooperative pool → funds Bill Support requests, Loan requests, Operations and Reserve
            </div>
            <div className="sec-div">Personal Information</div>
            {[["fullName","Full Name","text"],["email","Email Address (gmail address preferably)","email"],["phone","Phone Number","tel"],["occupation","Occupation","text"]].map(([k,l,t])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
            <div className="sec-div">Address</div>
            {[["address","Street Address","text"],["state","State","text"],["country","Country","text"]].map(([k,l,t])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
            <div className="sec-div">Next of Kin</div>
            {[["nokName","NOK Full Name","text"],["nokPhone","NOK Phone","tel"],["nokRelationship","Relationship","text"]].map(([k,l,t])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
            <div className="sec-div">Bank Account</div>
            {[["bankName","Bank Name","text"],["accountName","Account Name","text"],["accountNumber","Account Number","text"]].map(([k,l,t])=>(
              <div className="field" key={k}>
                <label>{l}</label>
                <input type={t} className={regErrors[k]?"field-err":""} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})}/>
                {regErrors[k]&&<div className="err-msg">{regErrors[k]}</div>}
              </div>
            ))}
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost btn-sm" onClick={close}>Cancel</button>
            <button className="btn btn-gold" onClick={handleRegister} disabled={loading}>{loading?"Registering...":"Register Free"}</button>
          </div>
        </div>
      </div>
    );

    if(modal.type==="regSuccess") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)close();}}>
        <div className="modal">
          <div className="modal-hdr" style={{background:`linear-gradient(135deg,${C.green},#0B6E4F)`}}>
            <div className="modal-title">🎉 Registration Successful!</div>
            <div className="modal-sub">Welcome to CoFundBills Cooperative</div>
          </div>
          <div className="modal-body">
            <div className="success-box"><strong>Your Link Code: {modal.linkCode}</strong><br/>Save this — you will use it to log in and share your invite link.</div>
            <div style={{fontWeight:700,color:C.navy,marginBottom:8,fontSize:13}}>Activate Your Membership</div>
            <div style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:10}}>
              Pay your first monthly contribution of <strong>{fmtNGN(getTier(modal.tier||1).monthly)}</strong> ({getTier(modal.tier||1).label}) to activate and join the queue. This is the only payment required until your contribution cell activates.
            </div>
            <div style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:10,padding:12,marginBottom:12,fontSize:12,lineHeight:1.9}}>
              <strong style={{color:C.navy,display:"block",marginBottom:4}}>Where your contributions go:</strong>
              💰 <strong>First Half — {fmtNGN(getTier(modal.tier||1).benefitPool)}/month</strong> stays in your cell → returned as <strong>{fmtNGN(getTier(modal.tier||1).cyclePayout)} cash</strong> at the end of your 10-month cycle<br/>
              🌊 <strong>Second Half — {fmtNGN(getTier(modal.tier||1).monthly - getTier(modal.tier||1).benefitPool)}/month</strong> merges with all other cells into the cooperative pool → funds Bill Support requests, Loan requests, Operations and Reserve
            </div>
            <div style={{background:C.white,border:`1.5px solid ${C.gold}`,borderRadius:10,padding:14,fontSize:13,lineHeight:1.9}}>
              <strong style={{color:C.navy}}>Payment Details</strong><br/>
              Royal Tech Partnership & Investment Limited<br/>
              Zenith Bank — <strong>1016621205</strong><br/>
              Reference: <strong>{modal.linkCode}</strong><br/>
              WhatsApp: <strong>+234 909 999 4816</strong>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn btn-green" onClick={close}>Got it!</button>
          </div>
        </div>
      </div>
    );

    if(modal.type==="login") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)close();}}>
        <div className="modal">
          <div className="modal-hdr"><div className="modal-title">Log In to Your Portal</div></div>
          <div className="modal-body">
            <div className="field"><label>Email Address</label>
              <input type="email" placeholder="your@email.com" value={loginForm.email} onChange={e=>setLoginForm({...loginForm,email:e.target.value})}/>
            </div>
            <div style={{textAlign:"center",color:C.muted,fontSize:12,margin:"4px 0"}}>— or —</div>
            <div className="field"><label>Link Code</label>
              <input type="text" placeholder="CFB-XXXXXX" value={loginForm.linkCode} onChange={e=>setLoginForm({...loginForm,linkCode:e.target.value.toUpperCase()})}/>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost btn-sm" onClick={close}>Cancel</button>
            <button className="btn btn-blue" onClick={handleLogin} disabled={loading}>{loading?"Logging in...":"Log In"}</button>
          </div>
        </div>
      </div>
    );

    if(modal.type==="adminLogin") return(
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)close();}}>
        <div className="modal">
          <div className="modal-hdr"><div className="modal-title">Admin Access</div></div>
          <div className="modal-body">
            <div className="field"><label>Admin Password</label>
              <input type="password" placeholder="Enter admin password"
                value={loginForm.linkCode} onChange={e=>setLoginForm({...loginForm,linkCode:e.target.value})}
                onKeyDown={e=>{if(e.key==="Enter"){if(loginForm.linkCode===ADMIN_PASS){setIsAdmin(true);setView("admin");close();}else showToast("Incorrect password","error");}}}/>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost btn-sm" onClick={close}>Cancel</button>
            <button className="btn btn-navy" onClick={()=>{
              if(loginForm.linkCode===ADMIN_PASS){setIsAdmin(true);setView("admin");close();}
              else showToast("Incorrect password","error");
            }}>Enter</button>
          </div>
        </div>
      </div>
    );

    return null;
  };

  // ── FAQ & T&C Overlays ────────────────────────────────────────
  const FaqOverlay = () => !faqOpen ? null : (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setFaqOpen(false);}}>
      <div className="modal">
        <div className="modal-hdr"><div className="modal-title">Frequently Asked Questions</div></div>
        <div className="modal-body">
          {FAQS.map(([q,a])=>(
            <div key={q} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:6}}>{q}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.75}}>{a}</div>
            </div>
          ))}
        </div>
        <div className="modal-foot"><button className="btn btn-ghost btn-sm" onClick={()=>setFaqOpen(false)}>Close</button></div>
      </div>
    </div>
  );

  const TcOverlay = () => !tcOpen ? null : (
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setTcOpen(false);}}>
      <div className="modal">
        <div className="modal-hdr"><div className="modal-title">Terms & Conditions</div><div className="modal-sub">CoFundBills Cooperative · Last updated 2026</div></div>
        <div className="modal-body">
          {TCS.map(([t,c])=>(
            <div key={t} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:6}}>{t}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.75}}>{c}</div>
            </div>
          ))}
        </div>
        <div className="modal-foot"><button className="btn btn-ghost btn-sm" onClick={()=>setTcOpen(false)}>Close</button></div>
      </div>
    </div>
  );

  // ── AI Chat Widget ────────────────────────────────────────────
  const ChatWidget = () => (
    <div style={{position:"fixed",bottom:80,right:20,zIndex:600}}>
      {chatOpen&&(
        <div style={{width:320,height:450,background:C.white,borderRadius:16,
          boxShadow:"0 8px 40px rgba(13,33,55,.25)",display:"flex",flexDirection:"column",
          marginBottom:10,border:`1px solid ${C.border}`}}>
          <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"14px 16px",
            borderRadius:"16px 16px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{color:C.white,fontWeight:800,fontSize:14}}>🤖 CoFundBills Assistant</div>
            <button style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:18}} onClick={()=>setChatOpen(false)}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
            {chatMsgs.map((msg,i)=>(
              <div key={i} style={{alignSelf:msg.role==="user"?"flex-end":"flex-start",
                background:msg.role==="user"?C.blue:C.bg,color:msg.role==="user"?C.white:C.dark,
                borderRadius:12,padding:"9px 13px",fontSize:12,maxWidth:"85%",lineHeight:1.6}}>
                {msg.content}
              </div>
            ))}
            {chatLoading&&<div style={{alignSelf:"flex-start",background:C.bg,borderRadius:12,padding:"9px 13px",fontSize:12,color:C.muted}}>Thinking...</div>}
          </div>
          <div style={{padding:10,borderTop:`1px solid ${C.border}`,display:"flex",gap:6}}>
            <input style={{flex:1,padding:"8px 12px",borderRadius:20,border:`1.5px solid ${C.border}`,fontSize:12,outline:"none"}}
              placeholder="Ask anything..." value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handleChat();}}/>
            <button className="btn btn-blue btn-sm" onClick={handleChat} disabled={chatLoading}>→</button>
          </div>
        </div>
      )}
      <button onClick={()=>setChatOpen(!chatOpen)}
        style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.navy},${C.blue})`,
          border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:22,boxShadow:"0 4px 20px rgba(13,33,55,.3)"}}>
        {chatOpen?"×":"💬"}
      </button>
    </div>
  );

  // ── Main App Return ───────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* Navbar */}
      <nav className="nav">
        <div className="nav-logo" onClick={()=>{setMember(null);setView("landing");}}>
          <span>CFB</span>
          <div><div style={{fontSize:12,lineHeight:1}}>CoFundBills</div><div style={{fontSize:9,opacity:.6,fontWeight:400}}>Cooperative</div></div>
        </div>
        <div className="nav-btns">
          <button className="btn btn-outline btn-sm" onClick={()=>setFaqOpen(true)}>FAQs</button>
          <button className="btn btn-outline btn-sm" onClick={()=>setTcOpen(true)}>T&C</button>
          <button className="btn btn-outline btn-sm" style={{color:C.gold,borderColor:C.gold}}
            onClick={()=>{setView("ajo");setAjoView("landing");}}>🧺 Import Ajo</button>
          {member?(
            <>
              <button className="btn btn-outline btn-sm" onClick={()=>{setView("portal");setPortalTab("dashboard");}}>My Portal</button>
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
      {view==="ajo"&&<AjoApp/>}

      {/* Modals */}
      {renderModal()}

      {/* FAQ & T&C */}
      <FaqOverlay/>
      <TcOverlay/>

      {/* Chat */}
      <ChatWidget/>

      {/* Powered by */}
      <div style={{position:"fixed",bottom:140,right:20,zIndex:400,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
        <div style={{fontSize:9,color:C.muted}}>Powered by Claude AI</div>
        <a href="https://wa.me/2348061631222?text=Hello%2C%20I%20have%20a%20question%20about%20CoFundBills" target="_blank" rel="noopener noreferrer"
          style={{display:"flex",alignItems:"center",gap:3,background:"#25D366",color:C.white,borderRadius:9,padding:"2px 7px",fontSize:10,fontWeight:700,textDecoration:"none"}}>
          💬 Admin
        </a>
      </div>
    </>
  );
}
