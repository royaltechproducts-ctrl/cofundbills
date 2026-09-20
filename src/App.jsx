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
  // ── Referral Bonus award ─────────────────────────────────────
  const awardReferralBonus = async (inviterCode, inviterTier, eventType, inviteeTier=1) => {
    if(!inviterCode) return;
    const inviter = members[inviterCode];
    if(!inviter || inviter.memberType==="admin") return;
    // Effective tier = MIN(inviter tier, invitee tier) — cannot earn above your station
    const effectiveTierNum = Math.min(inviterTier||1, inviteeTier||1);
    const t = getTier(effectiveTierNum);
    const pts = eventType==="activation" ? t.pts.referralActivation : t.pts.referralCycle;
    if(!pts) return;
    await supabase.from("cfb_credit_events").insert({
      link_code:inviterCode, event_type:`referral_bonus_${eventType}`,
      points:pts, description:`Referral Bonus — invitee ${eventType}`,
    });
    await supabase.from("cfb_members").update({
      credit_score: Math.max(0,(inviter.creditScore||0)+pts)
    }).eq("link_code",inviterCode);
  };

  // ── Try to form a cell — simple queue per tier ──────────────
  const tryFormCell = async (allMembers) => {
    // For each tier, check if 10 unplaced active members are waiting
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
        const activationMonth = now.toISOString().slice(0,7); // YYYY-MM
        // Next payment deadline = last day of following month
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
        // Send cell activation email to all 10 members
        const t = getTier(tierNum);
        for(const m of ten){
          if(m.email) {
            await sendEmail({
              to_email:m.email, to_name:m.fullName,
              subject:`CoFundBills — Your Contribution Cell is Now Active!`,
              message:`Dear ${m.fullName},\n\nGreat news! Your CoFundBills ${t.label} contribution cell has been formed and is now active.\n\nCell Code: ${cellCode}\nTier: ${t.label} (${t.name})\nCell Members: 10 contributing members\n\nYOUR PAYMENT SCHEDULE:\nMonth 1 (your activation payment) — Already paid ✅\nMonth 2 — Due by: ${fmtDate(nextDeadline)} (last day of ${nextDeadline.toLocaleString("en-NG",{month:"long",year:"numeric"})})\n\nMonthly contributions of ${fmtNGN(t.monthly)} are due by the last day of each month from now. The last week of each month is your reminder window. Missing the deadline costs you ${Math.abs(t.pts.missed)} credit score points.\n\nYour cycle payout of ${fmtNGN(t.cyclePayout)} will be disbursed at the end of Month 10.\n\nLog in to track your cell progress: cofundbills.vercel.app\nQuestions? WhatsApp +234 909 999 4816\n\nWarm regards,\nCoFundBills Cooperative`,
            });
          }
        }
        await loadCells();
        showToast(`Tier ${tierNum} cell ${cellCode} formed with 10 members!`);
      }
    }
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

      {/* CTA */}
      <div style={{background:C.bg,padding:"52px 24px",textAlign:"center"}}>
        <h2 style={{fontSize:22,fontWeight:900,color:C.navy,marginBottom:8}}>Ready to Co-Fund Your Bills?</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.8,maxWidth:460,margin:"0 auto 24px"}}>Join free today. Contribute ₦10,000 monthly, build your CoFund Credit Score, and access cooperative bill financing and loans.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn btn-gold btn-lg" onClick={()=>setModal({type:"register"})}>Join CoFundBills Free</button>
          <a className="wa-btn" href="https://wa.me/2348061631222?text=Hello%2C%20I%20have%20a%20question%20about%20CoFundBills" target="_blank" rel="noopener noreferrer">💬 Chat with Admin on WhatsApp</a>
        </div>
      </div>

      {/* Founder Bio */}
      <div style={{background:C.white,padding:"52px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <span className="section-tag" style={{background:"#EFF6FF",color:C.blue}}>Meet the Founder</span>
          <h2 className="section-title">Built on Trust. Driven by Purpose.</h2>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:40,alignItems:"flex-start",flexWrap:"wrap"}}
            className="grid-2">
            {/* Photo */}
            <div style={{textAlign:"center",flexShrink:0}}>
              <div style={{width:260,height:320,borderRadius:16,overflow:"hidden",
                boxShadow:"0 8px 32px rgba(13,33,55,0.15)",border:`3px solid ${C.gold}`,
                background:C.white,margin:"0 auto"}}>
                <img src={"data:image/jpeg;base64,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"}
                  alt="Ernest Igbinoba — President & Founder, CoFundBills Cooperative"
                  style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top"}}/>
              </div>
              <div style={{marginTop:14}}>
                <div style={{fontWeight:900,color:C.navy,fontSize:16}}>Ernest Igbinoba</div>
                <div style={{color:C.gold,fontWeight:700,fontSize:13,marginTop:2}}>President & Founder</div>
                <div style={{color:C.muted,fontSize:12,marginTop:2}}>CoFundBills Cooperative</div>
                <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:10,flexWrap:"wrap"}}>
                  {["BWCG Member","UNILAG · Building · 98 Set","Lagos, Nigeria"].map(t=>(
                    <span key={t} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,
                      padding:"3px 10px",fontSize:10,color:C.muted,fontWeight:600}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Bio text */}
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
              {/* Quote */}
              <div style={{borderLeft:`4px solid ${C.gold}`,paddingLeft:18,marginTop:8}}>
                <div style={{fontSize:16,color:C.navy,fontStyle:"italic",fontWeight:700,lineHeight:1.7}}>
                  "Don't face bills alone. Let's co-fund them."
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:6}}>— Ernest Igbinoba, Founder</div>
              </div>
              {/* Contact */}
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
      <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"48px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto",textAlign:"center"}}>
          <div style={{color:C.gold,fontWeight:900,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Legally Structured · Cooperative Society</div>
          <h2 style={{color:C.white,fontSize:22,fontWeight:900,marginBottom:20}}>Why CoFundBills is NOT a Pyramid Scheme</h2>
          <div className="grid-2" style={{textAlign:"left",gap:12}}>
            {[
              ["✅ No cash from recruiting","Invite links earn Referral Bonus points only — never cash. No tiered positions, no chain structure, no multi-level commissions."],
              ["✅ Real cooperative services","Contribution cells, bill support fund, credit scoring and loan facility are genuine cooperative services."],
              ["✅ Works without new members","Existing active members complete cycles, access loans and build credit indefinitely without new recruitment."],
              ["✅ Registered cooperative","Being registered as a Multi-Purpose Cooperative Society under Lagos State Cooperative Societies Law 2022."],
              ["✅ Every naira documented","50% benefit pool, 25% bill support, 12.5% loans, 7.5% admin, 5% reserve — transparent and automatic."],
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
    const cat = scoreCategory(m.creditScore, m.contributionTier||1, m.memberType==="founding");
    const myCells = cells.filter(c=>(c.seats||[]).some(s=>s.link_code===m.linkCode));
    const myLoans = loans.filter(l=>l.link_code===m.linkCode);

    return(
      <div style={{background:C.bg,minHeight:"100vh"}}>
        <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,padding:"22px 24px",marginBottom:0}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{color:C.gold,fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Member Portal</div>
              <div style={{fontWeight:900,fontSize:19,color:C.white}}>{m.fullName}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:2}}>{m.linkCode} · {m.memberType==="founding"?"🎖️ Founding Member — Zero Interest Loans & Quarterly Interest Share":"Regular Member"}</div>
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
            {[["dashboard","🏠 Dashboard"],["cells","My Cell"],["credit","Credit Score"],["loan","Co-Fund Loan"],["bills","Bill Support"],["invite","📨 Invite"],["statement","Statement"]].map(([id,lbl])=>(
              <button key={id} className={`portal-tab${portalTab===id?" active":""}`}
                style={portalTab===id?{background:C.blue,borderColor:C.blue,color:C.white}:{}}
                onClick={()=>setPortalTab(id)}>{lbl}</button>
            ))}
          </div>

          {/* Dashboard */}
          {portalTab==="dashboard"&&(
            <div>
              {/* Countdown timer for active cell members */}
              {(()=>{
                const myActiveCell = cells.find(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode));
                if(!myActiveCell||!myActiveCell.next_payment_deadline) return null;
                const deadline = new Date(myActiveCell.next_payment_deadline);
                deadline.setHours(23,59,59,999); // midnight on last day
                const now = new Date(); void tick; // tick forces re-render every minute
                const totalMs = deadline - now;
                const isOverdue = totalMs <= 0;
                const days = isOverdue ? 0 : Math.floor(totalMs/(1000*60*60*24));
                const hours = isOverdue ? 0 : Math.floor((totalMs%(1000*60*60*24))/(1000*60*60));
                const mins = isOverdue ? 0 : Math.floor((totalMs%(1000*60*60))/(1000*60));
                const urgency = isOverdue?"error":days<=3?"error":days<=7?"amber":"blue";
                const urgencyColor = urgency==="error"?C.error:urgency==="amber"?C.amber:C.blue;
                const cellTier = getTier(myActiveCell.contribution_tier||1);
                return(
                  <div style={{background:isOverdue?"#FEF2F2":days<=7?"#FEF3C7":"#EFF6FF",
                    border:`2px solid ${urgencyColor}`,borderRadius:14,padding:18,marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:12}}>
                      <div>
                        <div style={{fontWeight:800,color:urgencyColor,fontSize:13}}>
                          {isOverdue?"⚠️ Payment Overdue":days<=3?"🔴 Payment Due Urgently":days<=7?"🟡 Payment Due This Week":"📅 Next Contribution Due"}
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                          Month {(myActiveCell.month_number||1)+1} of 10 · {fmtDate(deadline)} · {cellTier.label}
                        </div>
                      </div>
                      <div style={{fontWeight:900,color:urgencyColor,fontSize:18}}>{fmtNGN(cellTier.monthly)}</div>
                    </div>
                    {/* Countdown boxes */}
                    {!isOverdue&&(
                      <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12}}>
                        {[["Days",days],["Hours",hours],["Minutes",mins]].map(([label,val])=>(
                          <div key={label} style={{background:urgencyColor,borderRadius:10,padding:"10px 16px",
                            textAlign:"center",minWidth:70,flex:1}}>
                            <div style={{fontSize:28,fontWeight:900,color:C.white,lineHeight:1}}>{String(val).padStart(2,"0")}</div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.8)",marginTop:3,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isOverdue&&(
                      <div style={{background:C.error,borderRadius:10,padding:"10px 16px",textAlign:"center",marginBottom:12}}>
                        <div style={{fontWeight:900,color:C.white,fontSize:14}}>Payment deadline has passed</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginTop:2}}>Contact admin immediately — WhatsApp +234 909 999 4816</div>
                      </div>
                    )}
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
                  Pay your first monthly contribution of <strong>{fmtNGN(getTier(m.contributionTier||1).monthly)}</strong> to activate your membership and join the {getTier(m.contributionTier||1).label} queue. This is the only payment required until your contribution cell activates.
                  <div style={{background:C.white,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:11,marginTop:10,lineHeight:1.9,fontSize:13}}>
                    <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                    Zenith Bank — 1016621205<br/>
                    Reference: <strong>{m.linkCode}</strong><br/>
                    WhatsApp: <strong>+234 909 999 4816</strong>
                  </div>
                </div>
              )}
              {m.status==="active"&&isInQueue(m,cells)&&(
                <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:14}}>
                  <strong style={{color:"#166534"}}>✅ You are in the {getTier(m.contributionTier||1).label} Queue</strong><br/>
                  <div style={{fontSize:12,color:"#166534",lineHeight:1.8,marginTop:6}}>
                    Your first contribution has been received and you are now in the queue. <strong>No further payments are required until your contribution cell activates.</strong><br/>
                    When 10 members are in the {getTier(m.contributionTier||1).label} queue, your cell will form automatically and you will receive an email with your Month 2 payment due date — the last day of the following calendar month.
                  </div>
                </div>
              )}
              {/* Tier change — only if not yet in active cell */}
              {(()=>{
                const myCell = cells.find(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode));
                const isLocked = !!myCell;
                const mTier = getTier(m.contributionTier||1);
                return !isLocked&&(
                  <div className="card" style={{marginBottom:14,border:`2px solid ${mTier.color}33`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:800,color:C.navy,fontSize:13}}>Your Contribution Tier</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>You can change this until your cell activates</div>
                      </div>
                      <span style={{background:mTier.color,color:C.white,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700}}>{mTier.label} — {mTier.name}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
                      {Object.values(TIERS).map(t=>(
                        <div key={t.id}
                          style={{borderRadius:10,padding:10,cursor:"pointer",transition:"all .2s",
                            border:`2px solid ${(m.contributionTier||1)===t.id?t.color:C.border}`,
                            background:(m.contributionTier||1)===t.id?t.color+"11":C.bg,
                            opacity:(m.contributionTier||1)===t.id?1:.8}}
                          onClick={async()=>{
                            await supabase.from("cfb_members").update({contribution_tier:t.id}).eq("link_code",m.linkCode);
                            setMember({...m, contributionTier:t.id});
                            showToast(`Tier updated to ${t.label} — ${t.name}`);
                          }}>
                          <div style={{fontWeight:800,color:t.color,fontSize:12}}>{t.label} {(m.contributionTier||1)===t.id?"✓":""}</div>
                          <div style={{fontSize:11,color:C.navy,fontWeight:600,marginTop:2}}>{t.name}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:2}}>Payout: {fmtNGN(t.cyclePayout)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {m.memberType==="founding"&&(
                <div style={{background:`linear-gradient(135deg,${C.burg},#9B2335)`,borderRadius:14,
                  padding:16,marginBottom:14,color:C.white}}>
                  <div style={{fontWeight:900,fontSize:14,marginBottom:8}}>🎖️ Founding Member Benefits</div>
                  <div style={{fontSize:13,lineHeight:1.85,opacity:.92}}>
                    As a Founding Member, you get <strong>loans at zero interest</strong>, and benefit from an <strong>exclusive quarterly share of loan interest revenue</strong> — 23 of every 25 quarterly slots distributed equally among all active Founding Members.
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
                  Share your invite link to help grow the cooperative. Members who join through your link earn you Referral Bonus points automatically when they activate — at the lower of the two tiers between you and the invited member.
                </div>
              </div>
            </div>
          )}

          {/* My Cells */}
          {portalTab==="cells"&&(
            <div>
              {/* Contingency protection notice */}
            <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:10,padding:14,marginBottom:14,fontSize:13,color:"#166534",lineHeight:1.8}}>
              <strong>🛡️ Your Payout is Protected</strong><br/>
              If any contributing member in your cell misses a monthly payment, the cooperative's dedicated Contingency Reserve covers the shortfall immediately. Your cycle payout of <strong>{fmtNGN(getTier(m.contributionTier||1).cyclePayout)}</strong> at the end of 10 months is guaranteed regardless of fellow cell members' defaults. Defaulting members face credit score deductions and cooperative disciplinary action — but their shortfall never reaches you.
            </div>
            {myCells.length===0?(
                <div className="card" style={{textAlign:"center",padding:36,color:C.muted}}>
                  {isInQueue(m,cells)
                    ? "You are in the queue. No further payments are due until your cell activates. You will receive an email when your cell is ready."
                    : "You are not yet placed in a contribution cell. Activate your membership to join the queue."}
                </div>
              ):myCells.map(c=>{
                const mySeat = (c.seats||[]).find(s=>s.link_code===m.linkCode);
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
                    {/* Payment schedule card */}
                    {nextDeadline&&(
                      <div style={{background:daysLeft<=7?"#FEF2F2":daysLeft<=14?"#FEF3C7":"#EFF6FF",
                        border:`1.5px solid ${daysLeft<=7?"#FCA5A5":daysLeft<=14?"#FCD34D":"#BFDBFE"}`,
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
              <div className="card" style={{textAlign:"center",padding:"24px",marginBottom:14}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{getTier(m.contributionTier||1).label} · Score threshold: {(getTier(m.contributionTier||1).excellentScore).toLocaleString()} pts for Excellent</div>
                <div style={{fontSize:52,fontWeight:900,color:cat.color}}>{m.creditScore.toLocaleString()}</div>
                <div style={{fontSize:15,fontWeight:700,color:cat.color,marginTop:3}}>{cat.label}</div>
                <div className="score-bar" style={{maxWidth:280,margin:"10px auto 0"}}>
                  <div className="score-fill" style={{width:Math.min(m.creditScore/getTier(m.contributionTier||1).excellentScore*100,100)+"%",background:cat.color}}/>
                </div>
                <div style={{fontSize:12,color:C.muted,marginTop:8}}>Loan rate: <strong>{cat.rate}%/month</strong> · Max loan: <strong>{fmtNGN(cat.limit)}</strong></div>
              </div>
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,marginBottom:10,fontSize:13}}>{getTier(m.contributionTier||1).label} — Score Thresholds & Loan Access</div>
                {[
                  {l:"Excellent Performance (Lowest Risk)",s:getTier(m.contributionTier||1).excellentScore,r:m.memberType==="founding"?0:1,limit:getTier(m.contributionTier||1).loanLimits.excellent,c:C.green},
                  {l:"Strong Performance (Low Risk)",s:getTier(m.contributionTier||1).strongScore,r:m.memberType==="founding"?0:2,limit:getTier(m.contributionTier||1).loanLimits.strong,c:C.blue},
                  {l:"Standard Performance (Medium Risk)",s:getTier(m.contributionTier||1).standardScore,r:m.memberType==="founding"?0:3,limit:getTier(m.contributionTier||1).loanLimits.standard,c:C.amber},
                  {l:"Minimal Performance (Higher-Risk)",s:0,r:m.memberType==="founding"?0:4,limit:getTier(m.contributionTier||1).loanLimits.minimal,c:C.error},
                ].map(cat=>(
                  <div key={cat.l} style={{borderRadius:8,padding:10,marginBottom:6,
                    background:m.creditScore>=(cat.s||0)?cat.c+"11":C.bg,
                    border:`1.5px solid ${m.creditScore>=(cat.s||0)?cat.c:C.border}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <span style={{fontWeight:700,color:cat.c,fontSize:12}}>{cat.l}</span>
                        <span style={{fontSize:10,color:C.muted,marginLeft:6}}>{cat.s>0?`${cat.s.toLocaleString()}+ pts`:"Below "+getTier(m.contributionTier||1).standardScore.toLocaleString()+" pts"}</span>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,fontWeight:700,color:C.navy}}>{cat.r}%/month</div>
                        <div style={{fontSize:10,color:C.muted}}>Max: {fmtNGN(cat.limit)}</div>
                      </div>
                    </div>
                    {m.creditScore>=(cat.s||0)&&<div style={{fontSize:10,color:cat.c,fontWeight:700,marginTop:3}}>✓ Your current category</div>}
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{fontWeight:800,color:C.navy,marginBottom:10,fontSize:13}}>How to Improve Your Score</div>
                {[
                  [`Contribute on time every month`,`+${getTier(m.contributionTier||1).pts.contribution} pts`],
                  ["Stay active in your contribution cell",`+${getTier(m.contributionTier||1).pts.cellActive} pts/month`],
                  [`Complete a full 10-month cycle`,`+${getTier(m.contributionTier||1).pts.cycleContrib.toLocaleString()} pts`],
                  [`Repay loans on time`,`+${getTier(m.contributionTier||1).pts.loanRepaid} pts per repayment`],
                  [`Invite members through your link`,`Referral Bonus: +${getTier(m.contributionTier||1).pts.referralActivation} pts per activated member (scored at lower of both tiers)`],
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
          {portalTab==="loan"&&(()=>{
            const mTier = getTier(m.contributionTier||1);
            const loanEligible = m.creditScore >= mTier.unlockScore;
            return(
            <div>
              {!loanEligible&&(
                <div className="warn-box">
                  <strong>🔒 Co-Fund Loan is not yet accessible.</strong><br/>
                  Required credit score: <strong>{mTier.unlockScore.toLocaleString()} pts minimum ({mTier.label})</strong><br/>
                  Your current score: <strong>{m.creditScore.toLocaleString()} pts</strong> — {cat.label}<br/>
                  You need <strong>{Math.max(0,mTier.unlockScore-m.creditScore).toLocaleString()} more points</strong> to unlock loan access.<br/>
                  <div style={{marginTop:8,fontSize:11,lineHeight:1.7}}>
                    Build your score through consistent contributions (+{mTier.pts.contribution} pts/month), completing cycles (+{mTier.pts.cycleContrib.toLocaleString()} pts) and holding network seats (+{mTier.pts.cellActive} pts/month per seat).
                  </div>
                </div>
              )}
              {loanEligible&&<div>
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,marginBottom:4,fontSize:13}}>Your Loan Eligibility</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Based on your CoFund Credit Score of {m.creditScore.toLocaleString()} pts ({cat.label}) · {mTier.label}</div>
              {m.memberType==="founding"&&(
                <div style={{background:"#F0FDF4",border:"1.5px solid #BBF7D0",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#166534",fontWeight:700}}>
                  🎖️ As a Founding Member, you get loans at zero interest, and benefit from exclusive quarterly share of loan interest revenue.
                </div>
              )}
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
              </div>}
            </div>
            );
          })()}

          {/* Bill Support */}
          {portalTab==="bills"&&(()=>{
            const billFund = funds[`bill_support_t${m.contributionTier||1}`]||funds.bill_support||0;
            const tierCap = getBillCap(billFund, m.contributionTier||1);
            const isEligible = m.creditScore >= getTier(m.contributionTier||1).unlockScore;
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
                    Your credit score: <strong>{m.creditScore.toLocaleString()} pts</strong> — Excellent Performance ({getTier(m.contributionTier||1).label}).<br/>
                    Note: A successful claim deducts <strong>{BILL_SCORE_COST} credit points</strong> from your score. You will need to rebuild to {getTier(m.contributionTier||1).billScoreMin.toLocaleString()}+ before your next claim.
                  </>
                ):(
                  <>
                    <strong>🔒 Bill support is not yet accessible.</strong><br/>
                    Required credit score: <strong>{getTier(m.contributionTier||1).unlockScore.toLocaleString()} pts minimum ({getTier(m.contributionTier||1).label})</strong><br/>
                    Your current score: <strong>{m.creditScore.toLocaleString()} pts</strong> — {scoreCategory(m.creditScore, m.contributionTier||1).label}<br/>
                    You need <strong>{Math.max(0,getTier(m.contributionTier||1).unlockScore-m.creditScore).toLocaleString()} more points</strong> to qualify.
                    <div style={{marginTop:8,fontSize:11,color:C.muted}}>
                      Build your score through consistent contributions (+{getTier(m.contributionTier||1).pts.contribution} pts/month), completing cycles (+{getTier(m.contributionTier||1).pts.cycleContrib} pts) and holding network seats (+{getTier(m.contributionTier||1).pts.cellActive} pts/month per seat).
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

          {/* Invite */}
          {portalTab==="invite"&&(()=>{
            const inviteLink = `https://cofundbills.vercel.app?ref=${m.linkCode}`;
            const inviteText = `You are personally invited to join the CoFundBills Cooperative Membership and Monthly Contribution Scheme.

Unlike the traditional thrift contribution and savings scheme where a few friends come together to form a single circle of contributors and one friend at a time gets to receive all the contributions — till everyone gets a turn to complete a cycle — CoFundBills Multipurpose Cooperative Society Limited is a digital version that offers a far more sophisticated and advanced thrift contribution and credit system with several groups of concurrently running contribution cells.

Every contributing member of a cell contributes their tier's monthly amount for 10 months to cash out half their savings at the end of the cycle — while the other half of their joint contributions merges with the halves from all other contribution cells on the platform to generate a massive cooperative pool of funds — half of which funds all Approved Bill Support Requests (house rents, children's school fees, medical bills, etc.) and the other half caters for Approved Loan Requests, Operations and Reserve.

CoFundBills offers four contribution tiers to suit your financial capacity:

— Tier 1: ₦10,000/month → ₦50,000 cycle payout
— Tier 2: ₦50,000/month → ₦250,000 cycle payout
— Tier 3: ₦100,000/month → ₦500,000 cycle payout
— Tier 4: ₦200,000/month → ₦1,000,000 cycle payout

Each tier has its own independent contribution cells — Tier 1 members form Tier 1 cells, Tier 2 members form Tier 2 cells, and so on. You choose the tier that works for you at registration and can change it any time before your cell activates.

Membership is strictly by invitation. New contribution groups form automatically when 10 members of the same tier are in the queue — first registered, first placed.

Join today at the tier that suits you best. Register now with my personal invite link and choose your preferred contribution tier:
${inviteLink}` ;

            const whatsappText = encodeURIComponent(inviteText);
            const whatsappURL = `https://wa.me/?text=${whatsappText}`;
            const emailSubject = encodeURIComponent("Personal Invitation — CoFundBills Cooperative Membership");
            const emailBody = encodeURIComponent(inviteText);
            const emailURL = `mailto:?subject=${emailSubject}&body=${emailBody}`;

            return(
            <div>
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:4}}>Your Personal Invite Link</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.7}}>
                  Share your personal invite link to grow the cooperative. Members who join through your link earn you Referral Bonus points automatically when they activate — at the lower of the two tiers between you and the invited member.
                </div>
                <div style={{background:C.bg,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:12,
                  fontFamily:"monospace",fontSize:12,wordBreak:"break-all",marginBottom:10}}>
                  {inviteLink}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>{
                  navigator.clipboard.writeText(inviteLink);
                  showToast("Invite link copied!");
                }}>📋 Copy Link</button>
              </div>

              {/* Invite message preview */}
              <div className="card" style={{marginBottom:14}}>
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:4}}>Your Personalised Invite Message</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Ready to send — your personal invite link is already embedded.</div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:14,
                  fontSize:12,color:C.dark,lineHeight:1.85,whiteSpace:"pre-wrap",marginBottom:14,
                  maxHeight:280,overflowY:"auto"}}>
                  {inviteText}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>{
                  navigator.clipboard.writeText(inviteText);
                  showToast("Invite message copied!");
                }}>📋 Copy Full Message</button>
              </div>

              {/* Send buttons */}
              <div className="card">
                <div style={{fontWeight:800,color:C.navy,fontSize:13,marginBottom:14}}>Send Your Invitation</div>
                <div className="grid-2" style={{gap:12}}>
                  {/* WhatsApp */}
                  <a href={whatsappURL} target="_blank" rel="noopener noreferrer"
                    style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                      background:"#25D366",color:C.white,borderRadius:12,padding:"16px 20px",
                      fontWeight:800,fontSize:14,textDecoration:"none",
                      boxShadow:"0 4px 14px rgba(37,211,102,.35)"}}>
                    <span style={{fontSize:22}}>💬</span>
                    <div>
                      <div>Send via WhatsApp</div>
                      <div style={{fontSize:11,fontWeight:400,opacity:.85}}>Opens WhatsApp with message ready</div>
                    </div>
                  </a>
                  {/* Email */}
                  <a href={emailURL}
                    style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                      background:C.blue,color:C.white,borderRadius:12,padding:"16px 20px",
                      fontWeight:800,fontSize:14,textDecoration:"none",
                      boxShadow:"0 4px 14px rgba(26,79,138,.35)"}}>
                    <span style={{fontSize:22}}>✉️</span>
                    <div>
                      <div>Send via Email</div>
                      <div style={{fontSize:11,fontWeight:400,opacity:.85}}>Opens your email app with message ready</div>
                    </div>
                  </a>
                </div>
                <div style={{marginTop:14,background:C.bg,borderRadius:8,padding:10,fontSize:11,color:C.muted,lineHeight:1.7}}>
                  💡 <strong>Tip:</strong> For WhatsApp, you can select specific contacts or groups after the app opens. For email, add your recipient's address in the To field. Your personal invite link is already embedded in both messages.
                </div>
              </div>

              {/* Credit score connection */}
              <div style={{background:`linear-gradient(135deg,${C.navy},${C.blue})`,borderRadius:14,padding:18,marginTop:14}}>
                <div style={{fontWeight:800,color:C.gold,fontSize:13,marginBottom:8}}>Why Inviting Members Benefits You</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.85)",lineHeight:1.85}}>
                  Every member who joins through your invite link and activates their membership earns you Referral Bonus points — automatically, no seat required. No seats, no chains, no limits. The more you invite, the more Referral Bonuss you build.
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginTop:12}}>
                  {[
                    {seat:"Referral Bonus — invited member activates",pts:`+${getTier(m.contributionTier||1).pts.referralActivation} pts`,c:C.green},
                    
                    {seat:"Each Additional Invitee",pts:"Same credits per person",c:C.amber},
                    {seat:"No Limit",pts:"Invite as many as you want",c:C.burg},
                  ].map(s=>(
                    <div key={s.seat} style={{background:"rgba(255,255,255,.08)",borderRadius:8,padding:10,textAlign:"center"}}>
                      <div style={{color:s.c,fontWeight:800,fontSize:12}}>{s.seat}</div>
                      <div style={{color:"rgba(255,255,255,.7)",fontSize:10,marginTop:3,lineHeight:1.5}}>{s.pts}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:10,lineHeight:1.7}}>
                  Referral Bonuss are a marginal score bonus for growing the cooperative. Your primary credit score growth comes from consistent contributions, completed cycles and timely loan repayments.
                </div>
              </div>
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

            <button className="btn btn-outline btn-sm" onClick={()=>setView("landing")}>🏠 Home</button>
          </div>
        </div>

        <div style={{maxWidth:1000,margin:"0 auto",padding:"20px 16px"}}>
          {/* Stats */}
          <div className="grid-4" style={{marginBottom:18}}>
            {[
              ["Total Members",allArr.length],["Active",activeArr.length],
              ["Pending",pendingArr.length],["Founding",foundingArr.length+"/25"],
              ["Queue T1",Object.values(members).filter(m=>m.status==="active"&&(m.contributionTier||1)===1&&!cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode))).length+" waiting"],
              ["Queue T2",Object.values(members).filter(m=>m.status==="active"&&(m.contributionTier||1)===2&&!cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode))).length+" waiting"],
              ["Queue T3",Object.values(members).filter(m=>m.status==="active"&&(m.contributionTier||1)===3&&!cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode))).length+" waiting"],
              ["Queue T4",Object.values(members).filter(m=>m.status==="active"&&(m.contributionTier||1)===4&&!cells.some(c=>c.status==="active"&&(c.seats||[]).some(s=>s.link_code===m.linkCode))).length+" waiting"],
              ["Active Cells",activeCells.length],
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
                  <div>
                    <span className="pill" style={{background:m.memberType==="admin"?C.green:m.memberType==="founding"?C.burg:C.blue,color:C.white,fontSize:10}}>{m.memberType==="admin"?"Admin":m.memberType==="founding"?"Founding":"Regular"}</span>
                    <span className="pill" style={{background:getTier(m.contributionTier||1).color+"22",color:getTier(m.contributionTier||1).color,border:`1px solid ${getTier(m.contributionTier||1).color}44`,fontSize:10,marginLeft:4}}>{getTier(m.contributionTier||1).label}</span>
                  </div>
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
      ["email","Email Address","email","(gmail address preferably)"],
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
            <div className="sec-div">Contribution Group Tier</div>
            <div className="info-box" style={{marginBottom:12}}>
              Select your preferred monthly contribution tier. You can change this anytime before your cell is activated with 10 contributing members.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:16}}>
              {Object.values(TIERS).map(t=>(
                <div key={t.id} onClick={()=>setRegForm({...regForm,contributionTier:t.id})}
                  style={{borderRadius:12,padding:14,cursor:"pointer",transition:"all .2s",
                    border:`2px solid ${regForm.contributionTier===t.id?t.color:C.border}`,
                    background:regForm.contributionTier===t.id?t.color+"11":C.white}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontWeight:800,color:t.color,fontSize:13}}>{t.label}</span>
                    {regForm.contributionTier===t.id&&<span style={{color:t.color,fontSize:16}}>✓</span>}
                  </div>
                  <div style={{fontWeight:700,color:C.navy,fontSize:14}}>{t.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4,lineHeight:1.6}}>
                    Cycle payout: <strong>{fmtNGN(t.cyclePayout)}</strong><br/>
                    Bill support: up to <strong>{fmtNGN(t.billCaps[t.billCaps.length-1].cap)}</strong>
                  </div>
                </div>
              ))}
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
            <div style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:10}}>
              Pay your first monthly contribution of <strong>{fmtNGN(getTier(modal.tier||1).monthly)}</strong> ({getTier(modal.tier||1).label}) to activate and join the queue.
            </div>
            <div style={{background:"#EFF6FF",border:"1.5px solid #BFDBFE",borderRadius:10,padding:12,marginBottom:12,fontSize:12,lineHeight:1.9}}>
              <strong style={{color:C.navy,display:"block",marginBottom:4}}>Where your contributions go:</strong>
              💰 <strong>First Half — {fmtNGN(getTier(modal.tier||1).benefitPool)}/month</strong> stays in your cell → returned as <strong>{fmtNGN(getTier(modal.tier||1).cyclePayout)} cash</strong> at the end of your 10-month cycle<br/>
              🌊 <strong>Second Half — {fmtNGN(getTier(modal.tier||1).monthly - getTier(modal.tier||1).benefitPool)}/month</strong> merges with all other cells into the cooperative pool → funds Bill Support requests, Loan requests, Operations and Reserve
            </div>
            <div style={{background:C.white,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:12,fontSize:13,lineHeight:1.9}}>
              <strong>Royal Tech Partnership & Investment Limited</strong><br/>
              Zenith Bank — 1016621205<br/>
              Amount: <strong>{fmtNGN(getTier(modal.tier||1).monthly)}</strong> ({getTier(modal.tier||1).label})<br/>
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
