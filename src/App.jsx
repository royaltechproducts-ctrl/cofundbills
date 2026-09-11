import { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { createClient } from "@supabase/supabase-js";

// ── CONSTANTS ──────────────────────────────────────────────────
const SUPABASE_URL     = "https://rzivcbhjyxspfcuopjjb.supabase.co";
const SUPABASE_KEY     = "sb_publishable_hE_FRwUG_Z40IYclv6SFYA_DNfLWFQU";
const EMAILJS_SERVICE  = "service_f7cd7ma";
const EMAILJS_TEMPLATE = "template_prggu9e";
const EMAILJS_PUBLIC   = "Jc6XKqOSgzxuJEs1G";
const ADMIN_PASSWORD   = "CoFundBills2026@RoyalTech";
const MONTHLY_CONTRIB  = 10000;
const YEARLY_CONTRIB   = 100000;
const CONTRIB_PART     = 0.2;    // 1/5th = 20% of any contribution
const LOAN_INTEREST    = 0.04;   // 4% regular, 3% premium, 2% founding, 1% partner
const PARTNER_SLOTS    = 10;
const ADMIN_SLOTS      = 2;
const FOUNDING_SLOTS   = 25;
const FOUNDING_TERM_MONTHS = 4;
const FOUNDING_RENEWAL = 50000;
const ADMIN_SHARE      = 0.2;
const POOL_SHARE       = 0.2;
const COMPANY          = "CoFundBills Cooperative";
const TAGLINE          = "Don't face bills alone. Let's co-fund them.";
const ADDRESS          = "2B, Olawale Cole, Onitiri Avenue, Lekki Phase 1, Lagos, Nigeria.";
const EMAIL_ADDR       = "cofundbills@gmail.com";
const PHONE            = "+234 806 163 1222";
const WEBSITE          = "CoFundBills.ng";

// ── COLOURS ────────────────────────────────────────────────────
const NAVY       = "#0D2137";
const BLUE       = "#1A4F8A";
const BLUE_LIGHT = "#E8F0FA";
const GOLD       = "#C9A84C";
const GOLD_LIGHT = "#FFF9EC";
const GREEN      = "#166534";
const GREEN_LIGHT= "#DCFCE7";
const WHITE      = "#FFFFFF";
const DARK       = "#1A1A1A";
const MUTED      = "#6B7280";
const ERROR      = "#9F1239";

// ── Tier Colours ─────────────────────────────────────────────
const TIER = {
  admin:   { bg:"#0B6E4F", bgDark:"#084F38", light:"#E6F4EF", accent:"#C9A84C", accentLight:"#FFF9EC", text:"Admin",        badge:"🛡️" },
  partner: { bg:"#4A0E8F", bgDark:"#360A6A", light:"#F0E8FF", accent:"#C9A84C", accentLight:"#FFF9EC", text:"Partner",      badge:"👑" },
  premium: { bg:"#8B5E3C", bgDark:"#6B4729", light:"#F5EDE4", accent:"#D4A96A", accentLight:"#FDF3E7", text:"Premium",      badge:"⭐" },
  regular:  { bg:"#1A4F8A", bgDark:"#163F70", light:"#E8F0FA", accent:"#F97316", accentLight:"#FFF3E8", text:"Regular",       badge:"🤝" },
  founding: { bg:"#7B1D1D", bgDark:"#5A1414", light:"#FDF2F2", accent:"#94A3B8", accentLight:"#F1F5F9", text:"Founding Member", badge:"🎖️" }, // permanently active
};
const getTier = (type) => TIER[type] || TIER.regular;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── HELPERS ────────────────────────────────────────────────────
const fmtNGN  = v => "₦" + Number(v||0).toLocaleString("en-NG");
const genCode = name => {
  const ini = name.trim().split(" ").map(w=>w[0]?.toUpperCase()||"X").join("").slice(0,3);
  return `CFB-${ini}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
};
const addDays  = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r.toISOString(); };
const addMonths= (d,n) => { const r=new Date(d); r.setMonth(r.getMonth()+n); return r.toISOString(); };
const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validatePhone = p => /^(\+?234|0)[789][01]\d{8}$/.test(p.replace(/\s/g,""));

// ── TC SECTIONS ────────────────────────────────────────────────
const TC_SECTIONS = [
  { title:"1. About CoFundBills Cooperative",
    body:"CoFundBills Cooperative is a member-powered digital cooperative designed to help members collectively prepare for and finance essential bills. It is NOT an insurance company, bank, financial investment scheme, pyramid scheme, or Multi-Level Marketing (MLM) organisation. Contributions are voluntary monthly membership payments — not premiums, deposits, or investment capital. Credits distributed are contributed funds redistributed through a network integration algorithm — not dividends, returns on investment, or profit-sharing. Operated by RoyalTech Partnership & Investment Limited, 2B, Olawale Cole, Onitiri Avenue, Lekki Phase 1, Lagos, Nigeria." },
  { title:"2. Membership and Contributions",
    items:[
      "Registration is free. Membership activation requires a monthly contribution of ₦10,000 to maintain an active link status.",
      "Each individual may hold only one CoFundBills account. Duplicate registrations are prohibited and will result in suspension and permanent forfeiture of all credits.",
      "Founding/Investor members hold perpetually active links with no monthly contribution requirement.",
      "Failure to make a monthly contribution on time results in immediate deactivation of the member's link. All incoming credits during inactive status are permanently lost and channelled to the Loan Fund Pool.",
      "Members are notified by email upon link deactivation and are responsible for renewing promptly to avoid further losses.",
    ]},
  { title:"3. Fund Distribution",
    items:[
      "Every ₦10,000 monthly contribution received is split equally into five parts of ₦2,000 each.",
      "One part (₦2,000) is credited to the member whose direct invite link generated the contributing member.",
      "One part (₦2,000) is credited to the member whose indirect invite link is associated with the contributing member.",
      "One part (₦2,000) is credited to the member whose extended invite link is associated with the contributing member.",
      "One part (₦2,000) is retained by CoFundBills administration for platform operations and compensation.",
      "One part (₦2,000) is deposited into the CoFundBills Loan Fund Pool to finance co-fund loans to members.",
      "Credits on inactive accounts and forfeited credits from lapsed links are also channelled into the Loan Fund Pool.",
    ]},
  { title:"4. Member Accounts",
    items:[
      "Each member holds two internal accounts: an Expendable Account and a Reserve Account.",
      "Every ₦2,000 credit received is split 50/50 — ₦1,000 to the Expendable Account and ₦1,000 to the Reserve Account.",
      "The Expendable Account is available for regular cashout requests, subject to admin approval.",
      "The Reserve Account accumulates as a dedicated fund for essential bills — rent, school fees, medical bills, and similar expenses. It cannot be accessed for general spending.",
      "Both accounts are subject to loan repayment deductions. Outstanding loan repayments are automatically applied to incoming credits before they are credited to member accounts.",
    ]},
  { title:"5. Co-Fund Loans",
    items:[
      "Members may apply for a Co-Fund Loan from the CoFundBills Loan Fund Pool.",
      "Loan eligibility and limit are assessed by admin based on the member's network performance — the projected 3-month contribution volume from the member's direct, indirect, and extended invite network.",
      "Loans attract a flat interest rate of 1% per month for Partner members, 2% per month for Founding members, 3% per month for Premium members, and 4% per month for Regular members on the outstanding balance.",
      "Loan approval is at the sole discretion of CoFundBills admin. No loan is guaranteed.",
      "Loan repayments are automatically deducted from incoming network credits before those credits are applied to the member's Expendable and Reserve Accounts.",
      "Interest proceeds from loans are distributed monthly to Investor/Founding members in proportion to their share holdings.",
    ]},
  { title:"6. Investor Shares",
    items:[
      "A total of 10 investor slots are available — 9 open to investors and 1 reserved for CoFundBills administration.",
      "Each investor slot represents an equal 1/10th share of monthly loan interest proceeds.",
      "Investor distributions are made monthly from confirmed interest collections — not from member contributions.",
      "Investor slots are by invitation only and are not available to the general public.",
    ]},
  { title:"7. Prohibited Conduct",
    items:[
      "Creating more than one CoFundBills account under any identity.",
      "Providing false or misleading personal information.",
      "Using automated tools or artificial means to generate fake contributions or manipulate credit distributions.",
      "Misrepresenting CoFundBills as an insurance company, investment scheme, or financial institution.",
    ]},
  { title:"8. Limitation of Liability",
    body:"CoFundBills Cooperative and its administrators shall not be liable for any loss of credits due to link inactivity, loan deductions, or platform changes. All participation is voluntary and at the member's own risk and judgment." },
  { title:"9. Governing Law",
    body:"These Terms are governed by the laws of the Federal Republic of Nigeria. All disputes shall first be referred to CoFundBills administration for resolution." },
  { title:"10. Contact",
    body:`${COMPANY} | ${ADDRESS} | Email: ${EMAIL_ADDR} | Phone: ${PHONE} | Website: ${WEBSITE}` },
];

// ── DATABASE ───────────────────────────────────────────────────
const DB = {
  async getMembers() {
    const {data} = await supabase.from("cfb_members").select("*");
    const map = {};
    (data||[]).forEach(m => { map[m.link_code] = {
      linkCode:m.link_code, fullName:m.full_name, email:m.email, phone:m.phone,
      occupation:m.occupation, state:m.state, country:m.country,
      refCode:m.ref_code, status:m.status, memberType:m.member_type,
      linkActive:m.link_active, activatedAt:m.activated_at, expiresAt:m.expires_at,
      expendable:Number(m.expendable||0), reserve:Number(m.reserve||0),
      totalCredited:Number(m.total_credited||0), loanBalance:Number(m.loan_balance||0),
      investorSlot:m.investor_slot, createdAt:m.created_at,
    };});
    return map;
  },
  async getCredits(code) {
    const {data} = await supabase.from("cfb_credits").select("*").eq("beneficiary_code",code).order("created_at",{ascending:false});
    return data||[];
  },
  async getCashouts(code) {
    const {data} = await supabase.from("cfb_cashouts").select("*").eq("link_code",code).order("created_at",{ascending:false});
    return data||[];
  },
  async getLoans(code) {
    const {data} = await supabase.from("cfb_loans").select("*").eq("link_code",code).order("created_at",{ascending:false});
    return data||[];
  },
  async getAllCashouts() {
    const {data} = await supabase.from("cfb_cashouts").select("*").order("created_at",{ascending:false});
    return data||[];
  },
  async getAllLoans() {
    const {data} = await supabase.from("cfb_loans").select("*").order("created_at",{ascending:false});
    return data||[];
  },
  async getLoanPool() {
    const {data} = await supabase.from("cfb_pool").select("*").eq("id",1).single();
    return data ? Number(data.balance||0) : 0;
  },
};

const trackVisit = async (page, refCode) => {
  try {
    await supabase.from("cfb_visitors").insert({
      page, ref_code:refCode||null,
      user_agent:navigator.userAgent,
      screen:`${window.screen.width}x${window.screen.height}`,
      language:navigator.language,
      referrer:document.referrer||null,
    });
  } catch(e) {}
};

const sendEmail = async ({to_email,to_name,subject,message}) => {
  try { await emailjs.send(EMAILJS_SERVICE,EMAILJS_TEMPLATE,{to_email,to_name,subject,message},EMAILJS_PUBLIC); }
  catch(e) { console.error("EmailJS:",e); }
};

// ── APP ────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]               = useState("landing");
  const [modal,setModal]             = useState(null);
  const [members,setMembers]         = useState({});
  const [note,setNote]               = useState(null);
  const [adminAuth,setAdminAuth]     = useState(false);
  const [adminPwd,setAdminPwd]       = useState("");
  const [adminPwdErr,setAdminPwdErr] = useState("");
  const [adminTab,setAdminTab]       = useState("members");
  const [portalTab,setPortalTab]     = useState("overview");
  const [currentMember,setCurrentMember] = useState(null);
  const [credits,setCredits]         = useState([]);
  const [cashouts,setCashouts]       = useState([]);
  const [loans,setLoans]             = useState([]);
  const [allCashouts,setAllCashouts] = useState([]);
  const [allLoans,setAllLoans]       = useState([]);
  const [loanPool,setLoanPool]       = useState(0);
  const [loginCode,setLoginCode]     = useState("");
  const [loginErr,setLoginErr]       = useState("");
  const [tcAccepted,setTcAccepted]   = useState(false);
  const [showTC,setShowTC]           = useState(false);
  const [regForm,setRegForm]         = useState({fullName:"",email:"",phone:"",occupation:"",state:"",country:"Nigeria",memberType:"regular",address:"",nokName:"",nokPhone:"",nokRelationship:"",bankName:"",accountName:"",accountNumber:""});
  const [regErrors,setRegErrors]     = useState({});
  const [cashoutForm,setCashoutForm] = useState({amount:"",type:"expendable",purpose:""});
  const [cashoutErr,setCashoutErr]   = useState("");
  const [loanForm,setLoanForm]       = useState({amount:"",purpose:"",billType:""});
  const [loanErr,setLoanErr]         = useState("");
  const [analytics,setAnalytics]     = useState([]);
  const [analyticsLoading,setAnalyticsLoading] = useState(false);
  const [loanCalc,setLoanCalc]       = useState({directInput:0,indirectInput:0,extendedInput:0});

  const showNote = (msg,type="success") => { setNote({msg,type}); setTimeout(()=>setNote(null),4500); };
  const urlRef = new URLSearchParams(window.location.search).get("ref")||"";

  // ── Live countdown timer ─────────────────────────────────────
  const [countdown,setCountdown] = useState("");
  useEffect(()=>{
    if(!currentMember) return;
    if(currentMember.memberType==="admin"||currentMember.memberType==="partner"||currentMember.memberType==="founding") return;
    if(!currentMember.expiresAt) return;
    const tick = ()=>{
      const diff = new Date(currentMember.expiresAt) - new Date();
      if(diff<=0){ setCountdown("EXPIRED"); return; }
      const d = Math.floor(diff/86400000);
      const h = Math.floor((diff%86400000)/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const s = Math.floor((diff%60000)/1000);
      setCountdown(`${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
    };
    tick();
    const timer = setInterval(tick,1000);
    return ()=>clearInterval(timer);
  },[currentMember]);

  const loadMembers = useCallback(async()=>{ setMembers(await DB.getMembers()); },[]);

  useEffect(()=>{ trackVisit(view, urlRef); },[view]);
  useEffect(()=>{ loadMembers(); DB.getLoanPool().then(setLoanPool); },[loadMembers]);
  useEffect(()=>{
    if(!currentMember) return;
    DB.getCredits(currentMember.linkCode).then(setCredits);
    DB.getCashouts(currentMember.linkCode).then(setCashouts);
    DB.getLoans(currentMember.linkCode).then(setLoans);
  },[currentMember]);

  const refreshMember = async () => {
    const m = await DB.getMembers();
    setMembers(m);
    if(currentMember) setCurrentMember(m[currentMember.linkCode]||null);
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    const {data} = await supabase.from("cfb_visitors").select("*").order("visited_at",{ascending:false}).limit(500);
    setAnalytics(data||[]);
    setAnalyticsLoading(false);
  };

  // ── Compute member's network counts ─────────────────────────
  const getNetworkCounts = (code) => {
    const allArr = Object.values(members);
    const direct   = allArr.filter(x=>x.refCode===code && x.linkActive).length;
    const indirect = allArr.filter(x=>{
      const parent = allArr.find(d=>d.linkCode===x.refCode);
      return parent?.refCode===code && x.linkActive;
    }).length;
    const extended = allArr.filter(x=>{
      const parent = allArr.find(d=>d.linkCode===x.refCode);
      if(!parent) return false;
      const gp = allArr.find(d=>d.linkCode===parent.refCode);
      return gp?.refCode===code && x.linkActive;
    }).length;
    return {direct, indirect, extended};
  };

  // ── REGISTER ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if(!tcAccepted){ setRegErrors({general:"Please accept the Terms & Conditions."}); return; }
    const errs={};
    ["fullName","email","phone","occupation","state","address","nokName","nokPhone","nokRelationship","bankName","accountName","accountNumber"].forEach(k=>{ if(!regForm[k].trim()) errs[k]="Required"; });
    if(regForm.email && !validateEmail(regForm.email)) errs.email="Invalid email address.";
    if(regForm.phone && !validatePhone(regForm.phone)) errs.phone="Invalid Nigerian phone number.";
    if(regForm.fullName.trim().split(" ").length<2) errs.fullName="Please enter your full name.";
    if(Object.keys(errs).length){ setRegErrors(errs); return; }

    const {data:existE} = await supabase.from("cfb_members").select("link_code").eq("email",regForm.email.trim().toLowerCase()).limit(1);
    if(existE?.length>0){ setRegErrors({email:"This email is already registered."}); return; }
    const {data:existP} = await supabase.from("cfb_members").select("link_code").eq("phone",regForm.phone.trim()).limit(1);
    if(existP?.length>0){ setRegErrors({phone:"This phone number is already registered."}); return; }

    const linkCode = genCode(regForm.fullName);
    const {error} = await supabase.from("cfb_members").insert({
      link_code:linkCode, full_name:regForm.fullName.trim(),
      email:regForm.email.trim().toLowerCase(), phone:regForm.phone.trim(),
      occupation:regForm.occupation.trim(), state:regForm.state.trim(),
      country:regForm.country, address:regForm.address.trim(),
      nok_name:regForm.nokName.trim(), nok_phone:regForm.nokPhone.trim(),
      nok_relationship:regForm.nokRelationship.trim(),
      bank_name:regForm.bankName.trim(), account_name:regForm.accountName.trim(),
      account_number:regForm.accountNumber.trim(), ref_code:urlRef||null,
      status:"pending", member_type:regForm.memberType||"regular", link_active:false,
      expendable:0, reserve:0, total_credited:0, loan_balance:0,
    });
    if(error){ showNote("Registration failed. Please try again.","error"); return; }

    // Upload valid ID if provided
    if(regForm.validId){
      const ext = regForm.validId.name.split(".").pop();
      const path = `${linkCode}/valid-id.${ext}`;
      const {error:uploadErr} = await supabase.storage.from("cfb-valid-ids").upload(path, regForm.validId);
      if(!uploadErr){
        const {data:urlData} = supabase.storage.from("cfb-valid-ids").getPublicUrl(path);
        await supabase.from("cfb_members").update({valid_id_url:urlData.publicUrl}).eq("link_code",linkCode);
      }
    }

    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`New CoFundBills Registration — ${regForm.fullName}`,
      message:`New member registered:\nName: ${regForm.fullName}\nEmail: ${regForm.email}\nPhone: ${regForm.phone}\nMembership: ${regForm.memberType}\nLink Code: ${linkCode}\nOccupation: ${regForm.occupation}\nState: ${regForm.state}\nAddress: ${regForm.address}\nNOK: ${regForm.nokName} (${regForm.nokRelationship}) - ${regForm.nokPhone}\nBank: ${regForm.bankName} | ${regForm.accountName} | ${regForm.accountNumber}\nReferred by: ${urlRef||"Direct"}\n\nMust pay contribution to activate.`});

    setModal({type:"reg_success",linkCode,name:regForm.fullName});
    setRegForm({fullName:"",email:"",phone:"",occupation:"",state:"",country:"Nigeria"});
    setRegErrors({});
    loadMembers();
  };

  // ── LOGIN ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginErr("");
    const code = loginCode.trim().toUpperCase();
    const m = await DB.getMembers();
    const found = m[code];
    if(!found){ setLoginErr("Link Code not found. Please check and try again."); return; }
    setCurrentMember(found);
    setLoginCode("");
    setModal(null);
    setPortalTab("overview");
    setView("portal");
  };

  // ── DISTRIBUTE CREDITS ────────────────────────────────────────
  const distributeCredits = async (sourceCode, refCode, contribution, triggerType="contribution") => {
    if(!refCode) return;
    const m = await DB.getMembers();

    // Helper: credit a member (auto-repay loan first)
    const creditMember = async (member, amt, level) => {
      if(!member||!member.linkActive){
        // Inactive — goes to pool
        await supabase.rpc("cfb_add_to_pool",{p_amount:amt}).catch(()=>{});
        return;
      }
      let creditAmt = amt;
      if(member.loanBalance > 0){
        const repay = Math.min(creditAmt, member.loanBalance);
        await supabase.from("cfb_members").update({loan_balance:member.loanBalance-repay}).eq("link_code",member.linkCode);
        await supabase.from("cfb_loan_payments").insert({link_code:member.linkCode,amount:repay,auto:true});
        creditAmt -= repay;
      }
      if(creditAmt > 0){
        const half = creditAmt/2;
        await supabase.from("cfb_credits").insert({beneficiary_code:member.linkCode,source_code:sourceCode,level,amount:creditAmt,trigger:triggerType});
        await supabase.rpc("cfb_credit_member",{p_code:member.linkCode,p_amount:creditAmt}).catch(async()=>{
          await supabase.from("cfb_members").update({
            expendable:member.expendable+half,
            reserve:member.reserve+half,
            total_credited:member.totalCredited+creditAmt,
          }).eq("link_code",member.linkCode);
        });
      }
    };

    const direct   = m[refCode];
    const indirect = direct  ? m[direct.refCode]   : null;
    const circuitous = indirect ? m[indirect.refCode] : null;

    const isRoot = (mem) => mem && (mem.memberType==="partner"||mem.memberType==="admin");

    if(isRoot(direct)){
      // Root at direct: takes 3 parts, no indirect/circuitous
      await creditMember(direct, contribution*0.6, "direct");
      await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*POOL_SHARE}).catch(()=>{});
    } else if(direct && isRoot(indirect)){
      // Invited at direct, Root at indirect: direct gets 1 part, root gets 2 parts, no circuitous
      await creditMember(direct,    contribution*0.2, "direct");
      await creditMember(indirect,  contribution*0.4, "indirect");
      await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*POOL_SHARE}).catch(()=>{});
    } else if(direct && indirect && isRoot(circuitous)){
      // Invited at direct, Invited at indirect, Root at circuitous: each gets 1 part
      await creditMember(direct,     contribution*0.2, "direct");
      await creditMember(indirect,   contribution*0.2, "indirect");
      await creditMember(circuitous, contribution*0.2, "circuitous");
      await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*POOL_SHARE}).catch(()=>{});
    } else {
      // All invited members in chain
      if(direct)     await creditMember(direct,     contribution*0.2, "direct");
      else await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*0.2}).catch(()=>{});
      if(indirect)   await creditMember(indirect,   contribution*0.2, "indirect");
      else await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*0.2}).catch(()=>{});
      if(circuitous) await creditMember(circuitous, contribution*0.2, "circuitous");
      else await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*0.2}).catch(()=>{});
    }
    // Admin operations share always goes to pool (admin handles separately)
    await supabase.rpc("cfb_add_to_pool",{p_amount:contribution*ADMIN_SHARE}).catch(()=>{});
  };

  // ── ADMIN: ACTIVATE MEMBER ────────────────────────────────────
  const handleActivate = async (code) => {
    const m = members[code];
    const now = new Date().toISOString();
    const expires = m.memberType==="premium" ? addMonths(now,12) : (m.memberType==="partner"||m.memberType==="admin"||m.memberType==="founding") ? null : addMonths(now,1);
    await supabase.from("cfb_members").update({status:"active",link_active:true,activated_at:now,expires_at:expires}).eq("link_code",code);
    // Credit chain for activation
    const contribAmt = m.memberType==="premium"?YEARLY_CONTRIB:MONTHLY_CONTRIB;
    await distributeCredits(code, m.refCode, contribAmt, "activation");
    // Admin pool share + loan pool
    await supabase.rpc("cfb_add_to_pool",{p_amount:CONTRIB_PART}).catch(()=>{});
    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`Forward to: ${m.fullName} | ${m.email} — CoFundBills Activated`,
      message:`Dear ${m.fullName},\n\nYour CoFundBills Cooperative link is now ACTIVE!\n\nYour Unique Link Code: ${code}\nYour Co-Fund Invite Link: https://cofundbills.vercel.app?ref=${code}\n\nShare your Co-Fund Invite Link with everyone. Every contribution from your network earns you credits — up to 3 levels deep (Direct, Indirect, and Circuitous).\n\nRemember: renew your ₦10,000 monthly contribution before the end of each month to stay active and keep earning.\n\n"${TAGLINE}"\n\n${COMPANY}\n${ADDRESS}\n${EMAIL_ADDR}`});
    await loadMembers();
    showNote(`${m.fullName} activated successfully.`);
  };

  // ── ADMIN: RENEW MEMBER ───────────────────────────────────────
  const handleRenew = async (code) => {
    const m = members[code];
    const now = new Date().toISOString();
    const expires = m.memberType==="premium" ? addMonths(now,12) : addMonths(now,1);
    await supabase.from("cfb_members").update({status:"active",link_active:true,expires_at:expires}).eq("link_code",code);
    const contribAmtR = m.memberType==="premium"?YEARLY_CONTRIB:MONTHLY_CONTRIB;
    await distributeCredits(code, m.refCode, contribAmtR, "renewal");
    await supabase.rpc("cfb_add_to_pool",{p_amount:CONTRIB_PART}).catch(()=>{});
    await loadMembers();
    showNote(`${m.fullName} renewed for 1 month.`);
  };

  // ── ADMIN: DEACTIVATE EXPIRED ─────────────────────────────────
  const handleDeactivate = async (code) => {
    const m = members[code];
    // Partners downgrade to founding on contract lapse — never go inactive
    if(m.memberType==="partner"){
      await supabase.from("cfb_members").update({member_type:"founding",status:"active",link_active:true,expires_at:null}).eq("link_code",code);
      await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
        subject:`Forward to: ${m.fullName} | ${m.email} — Partner Status Downgraded to Founding Member`,
        message:`Dear ${m.fullName},

Your Partner/Investor contract term has lapsed. Your membership has been automatically downgraded to Founding Member status.

As a Founding Member, your Co-Fund Invite Link remains permanently active and your credit earnings and accounts are fully preserved.

You may re-upgrade to Partner/Investor status when a slot becomes available.

"Don't face bills alone. Let's co-fund them."
CoFundBills Cooperative`});
      await loadMembers();
      showNote(`${m.fullName} downgraded from Partner to Founding Member.`);
      return;
    }
    await supabase.from("cfb_members").update({link_active:false,status:"inactive"}).eq("link_code",code);
    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`Forward to: ${m.fullName} | ${m.email} — Link Deactivated`,
      message:`Dear ${m.fullName},\n\nYour CoFundBills link has been DEACTIVATED due to non-renewal.\n\n⚠️ IMPORTANT: Any contributions that arrive through your network while your link is inactive will be permanently lost to the Loan Fund Pool — they cannot be recovered.\n\nTo reactivate immediately, pay ₦10,000 to:\nRoyal Tech Partnership & Investment Limited\nZenith Bank — 1016621205\nReference: ${code} — RENEWAL\n\nThen WhatsApp: +234 909 999 4816\n\n"${TAGLINE}"\n${COMPANY}`});
    await loadMembers();
    showNote(`${m.fullName} deactivated. Email alert sent.`);
  };

  // ── CASHOUT REQUEST ───────────────────────────────────────────
  const handleCashoutRequest = async () => {
    setCashoutErr("");
    const amt = Number(cashoutForm.amount);
    if(!amt||amt<5000){ setCashoutErr("Minimum cashout is ₦5,000."); return; }
    const m = currentMember;
    if(cashoutForm.type==="expendable"){
      if(amt>m.expendable){ setCashoutErr(`Insufficient expendable balance. Available: ${fmtNGN(m.expendable)}.`); return; }
    } else {
      if(amt>m.reserve){ setCashoutErr(`Insufficient reserve balance. Available: ${fmtNGN(m.reserve)}.`); return; }
      if(!cashoutForm.purpose.trim()){ setCashoutErr("Please describe the bill purpose for reserve withdrawal."); return; }
    }
    await supabase.from("cfb_cashouts").insert({link_code:m.linkCode,full_name:m.fullName,email:m.email,amount:amt,type:cashoutForm.type,purpose:cashoutForm.purpose,status:"pending"});
    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`Cashout Request — ${m.fullName} (${cashoutForm.type})`,
      message:`Cashout request:\nName: ${m.fullName}\nCode: ${m.linkCode}\nType: ${cashoutForm.type}\nAmount: ${fmtNGN(amt)}\nPurpose: ${cashoutForm.purpose||"N/A"}`});
    setCashoutForm({amount:"",type:"expendable",purpose:""});
    setModal(null);
    showNote("Cashout request submitted. Admin will process within 24 hours.");
    DB.getCashouts(m.linkCode).then(setCashouts);
  };

  // ── LOAN REQUEST ──────────────────────────────────────────────
  const handleLoanRequest = async () => {
    setLoanErr("");
    const amt = Number(loanForm.amount);
    if(!amt||amt<10000){ setLoanErr("Minimum loan amount is ₦10,000."); return; }
    if(!loanForm.purpose.trim()){ setLoanErr("Please describe the purpose of the co-fund loan."); return; }
    if(!loanForm.billType.trim()){ setLoanErr("Please select a bill type."); return; }
    const m = currentMember;
    if(m.loanBalance>0){ setLoanErr("You have an outstanding loan. Please clear your existing balance before applying for a new loan."); return; }

    // Calculate loan limit — projected 3-month network contributions
    const allArr = Object.values(members);
    const direct   = allArr.filter(x=>x.refCode===m.linkCode&&x.linkActive).length;
    const indirect = allArr.filter(x=>allArr.find(d=>d.linkCode===x.refCode&&d.refCode===m.linkCode)&&x.linkActive).length;
    const extended = allArr.filter(x=>{
      const parent = allArr.find(d=>d.linkCode===x.refCode);
      if(!parent) return false;
      const gp = allArr.find(d=>d.linkCode===parent.refCode);
      return gp?.refCode===m.linkCode && x.linkActive;
    }).length;
    const monthlyNetwork = (direct+indirect+extended)*MONTHLY_CONTRIB;
    const loanLimit = monthlyNetwork*3;

    if(amt>loanLimit&&loanLimit>0){ setLoanErr(`Loan limit based on your 3-month network projection is ${fmtNGN(loanLimit)}.`); return; }

    const effectiveRate = m.memberType==="partner"?0.01:m.memberType==="founding"?0.02:m.memberType==="premium"?0.03:0.04;
    const monthsProjection = m.memberType==="partner"?6:m.memberType==="founding"?5:m.memberType==="premium"?4:3;
    const loanLimitFinal = (direct+indirect+extended)*MONTHLY_CONTRIB*monthsProjection*0.2*3; // 3 levels × 20%
    await supabase.from("cfb_loans").insert({link_code:m.linkCode,full_name:m.fullName,email:m.email,amount:amt,interest_rate:effectiveRate,purpose:loanForm.purpose,bill_type:loanForm.billType,status:"pending",network_direct:direct,network_indirect:indirect,network_extended:extended,loan_limit:loanLimitFinal});
    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`Co-Fund Loan Request — ${m.fullName}`,
      message:`Loan request:\nName: ${m.fullName}\nCode: ${m.linkCode}\nAmount: ${fmtNGN(amt)}\nBill Type: ${loanForm.billType}\nPurpose: ${loanForm.purpose}\nNetwork: Direct(${direct}), Indirect(${indirect}), Extended(${extended})\nProjected 3-month limit: ${fmtNGN(loanLimit)}`});
    setLoanForm({amount:"",purpose:"",billType:""});
    setModal(null);
    showNote("Co-Fund loan request submitted. Admin will review your network performance and respond within 48 hours.");
    DB.getLoans(m.linkCode).then(setLoans);
  };

  // ── ADMIN: APPROVE CASHOUT ────────────────────────────────────
  const handleApproveCashout = async (c) => {
    const m = members[c.link_code];
    if(!m) return;
    const amt = Number(c.amount);
    const updates = c.type==="expendable"
      ? {expendable:Math.max(0,m.expendable-amt)}
      : {reserve:Math.max(0,m.reserve-amt)};
    await supabase.from("cfb_cashouts").update({status:"approved"}).eq("id",c.id);
    await supabase.from("cfb_members").update(updates).eq("link_code",c.link_code);
    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`Forward to: ${c.full_name} | ${c.email} — Cashout Approved`,
      message:`Dear ${c.full_name},\n\nYour cashout of ${fmtNGN(amt)} (${c.type}) has been APPROVED and will be processed to your bank account within 24 hours.\n\n"${TAGLINE}"\n${COMPANY}`});
    setAllCashouts(await DB.getAllCashouts());
    await loadMembers();
    showNote(`Cashout approved for ${c.full_name}.`);
  };

  // ── ADMIN: APPROVE LOAN ───────────────────────────────────────
  const handleApproveLoan = async (loan) => {
    const m = members[loan.link_code];
    if(!m) return;
    const amt = Number(loan.amount);
    const approvedRate = Number(loan.interest_rate)||LOAN_INTEREST;
    const approvedMonths = members[loan.link_code]?.memberType==="partner"?6:members[loan.link_code]?.memberType==="founding"?5:members[loan.link_code]?.memberType==="premium"?4:3;
    const totalRepay = amt + (amt*approvedRate*approvedMonths);
    await supabase.from("cfb_loans").update({status:"approved",approved_at:new Date().toISOString(),total_repayable:totalRepay}).eq("id",loan.id);
    await supabase.from("cfb_members").update({loan_balance:m.loanBalance+totalRepay}).eq("link_code",loan.link_code);
    await supabase.rpc("cfb_add_to_pool",{p_amount:-amt}).catch(()=>{});
    await sendEmail({to_email:EMAIL_ADDR,to_name:"CoFundBills Admin",
      subject:`Forward to: ${loan.full_name} | ${loan.email} — Co-Fund Loan Approved`,
      message:`Dear ${loan.full_name},\n\nYour Co-Fund Loan of ${fmtNGN(amt)} has been APPROVED!\n\nLoan Amount: ${fmtNGN(amt)}\nInterest Rate: 5% per month\nTotal Repayable (3 months): ${fmtNGN(totalRepay)}\n\nRepayments will be automatically deducted from your incoming network credits.\n\n"${TAGLINE}"\n${COMPANY}`});
    setAllLoans(await DB.getAllLoans());
    await loadMembers();
    showNote(`Loan approved for ${loan.full_name}.`);
  };

  const handleRejectLoan = async (loan) => {
    await supabase.from("cfb_loans").update({status:"rejected"}).eq("id",loan.id);
    setAllLoans(await DB.getAllLoans());
    showNote("Loan rejected.");
  };

  const handleRejectCashout = async (c) => {
    await supabase.from("cfb_cashouts").update({status:"rejected"}).eq("id",c.id);
    setAllCashouts(await DB.getAllCashouts());
    showNote("Cashout rejected.");
  };

  const handleDelete = async (code,name) => {
    if(!window.confirm(`Permanently delete member "${name}" (${code})? This cannot be undone.`)) return;
    await supabase.from("cfb_credits").delete().eq("beneficiary_code",code);
    await supabase.from("cfb_cashouts").delete().eq("link_code",code);
    await supabase.from("cfb_loans").delete().eq("link_code",code);
    await supabase.from("cfb_members").delete().eq("link_code",code);
    await loadMembers();
    showNote(`${name} permanently deleted.`);
  };

  // ── CSS ────────────────────────────────────────────────────────
  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;background:#F0F4FA;color:${DARK};min-height:100vh}
    .nav{background:linear-gradient(135deg,${NAVY},${BLUE});padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(13,33,55,0.3)}
    .nav-logo{width:38px;height:38px;background:${WHITE};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;font-weight:900;color:${NAVY}}
    .nav-name{color:${WHITE};font-weight:900;font-size:15px;cursor:pointer;letter-spacing:.3px}
    .nav-sub{font-size:10px;color:rgba(255,255,255,0.6)}
    .nav-links{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .nav-btn{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:${WHITE};padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}
    .nav-btn:hover{background:rgba(255,255,255,0.25)}
    .nav-btn-gold{background:${GOLD}!important;border-color:${GOLD}!important;color:${DARK}!important}
    .hero{background:linear-gradient(135deg,${NAVY} 0%,${BLUE} 70%,#1E6BBA 100%);padding:72px 24px 56px;text-align:center;position:relative;overflow:hidden}
    .hero-badge{display:inline-block;background:rgba(201,168,76,0.25);border:1px solid ${GOLD};color:${GOLD};font-size:12px;font-weight:700;padding:4px 16px;border-radius:20px;margin-bottom:16px;letter-spacing:1px}
    .hero-title{font-size:clamp(28px,5vw,52px);font-weight:900;color:${WHITE};line-height:1.15;margin-bottom:12px}
    .hero-title span{color:${GOLD}}
    .hero-sub{font-size:clamp(13px,2vw,17px);color:rgba(255,255,255,0.82);max-width:600px;margin:0 auto 16px;line-height:1.7}
    .hero-tagline{font-size:15px;font-style:italic;color:${GOLD};margin-bottom:32px;font-weight:600}
    .hero-steps{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:32px}
    .hero-step{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:${WHITE};padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.5px}
    .hero-step-arrow{color:${GOLD};font-size:14px;display:flex;align-items:center}
    .hero-btns{display:flex;flex-direction:column;align-items:center;gap:12px}
    .btn{padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    .btn-navy{background:${NAVY};color:${WHITE}}
    .btn-navy:hover:not(:disabled){background:#0A1B2E}
    .btn-blue{background:${BLUE};color:${WHITE}}
    .btn-blue:hover:not(:disabled){background:#163F70}
    .btn-gold{background:${GOLD};color:${DARK}}
    .btn-gold:hover{opacity:.9}
    .btn-outline{background:transparent;border:2px solid rgba(255,255,255,0.5);color:${WHITE}}
    .btn-outline:hover{background:rgba(255,255,255,0.1)}
    .btn-outline-blue{background:transparent;border:2px solid ${BLUE};color:${BLUE}}
    .btn-green{background:${GREEN};color:${WHITE}}
    .btn-sm{padding:7px 16px;font-size:12px}
    .btn-lg{padding:14px 36px;font-size:15px;width:100%;max-width:300px}
    .stats-bar{background:${GOLD};padding:14px 24px;display:flex;justify-content:space-around;gap:12px;flex-wrap:wrap}
    .stat-item{text-align:center}
    .stat-val{font-size:20px;font-weight:900;color:${NAVY}}
    .stat-lbl{font-size:10px;font-weight:700;color:${NAVY};opacity:.8;text-transform:uppercase;letter-spacing:.5px}
    .section{padding:56px 24px;max-width:1100px;margin:0 auto}
    .section-title{font-size:clamp(22px,3vw,32px);font-weight:900;color:${NAVY};text-align:center;margin-bottom:8px}
    .section-sub{font-size:15px;color:${MUTED};text-align:center;margin-bottom:40px;line-height:1.7}
    .card{background:${WHITE};border-radius:16px;padding:28px;box-shadow:0 4px 24px rgba(13,33,55,0.08);border:1px solid #D0DAED}
    .how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
    .how-card{background:${WHITE};border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(13,33,55,0.07);border:1px solid #D0DAED;text-align:center;border-top:4px solid ${BLUE}}
    .how-icon{font-size:36px;margin-bottom:12px}
    .how-num{width:28px;height:28px;background:${NAVY};color:${WHITE};border-radius:50%;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 10px}
    .how-title{font-size:14px;font-weight:800;color:${NAVY};margin-bottom:6px}
    .how-desc{font-size:12px;color:${MUTED};line-height:1.7}
    .dist-row{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:20px}
    .dist-cell{background:${BLUE_LIGHT};border-radius:10px;padding:14px;text-align:center;border-top:3px solid ${BLUE}}
    .dist-label{font-size:10px;font-weight:700;color:${BLUE};text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
    .dist-amt{font-size:18px;font-weight:900;color:${NAVY}}
    .dist-desc{font-size:10px;color:${MUTED};margin-top:4px;line-height:1.5}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
    .modal{background:${WHITE};border-radius:16px;padding:32px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.2)}
    .modal-title{font-size:20px;font-weight:900;color:${NAVY};margin-bottom:6px}
    .modal-sub{font-size:13px;color:${MUTED};margin-bottom:20px}
    .field{margin-bottom:14px}
    .field label{display:block;font-size:13px;font-weight:600;color:${NAVY};margin-bottom:5px}
    .field input,.field select,.field textarea{width:100%;padding:10px 14px;border:1.5px solid #C8D4E8;border-radius:8px;font-size:14px;font-family:inherit;outline:none;background:${WHITE};color:${DARK};transition:border .2s}
    .field input:focus,.field select:focus,.field textarea:focus{border-color:${BLUE}}
    .field-err{border-color:${ERROR}!important}
    .err-msg{font-size:11px;color:${ERROR};margin-top:3px}
    .notification{position:fixed;top:80px;right:20px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:340px}
    .note-success{background:#DCFCE7;color:${GREEN};border:1px solid #86EFAC}
    .note-error{background:#FEE2E2;color:${ERROR};border:1px solid #FCA5A5}
    .portal-wrap{max-width:900px;margin:0 auto;padding:32px 20px}
    .portal-header{background:linear-gradient(135deg,${NAVY},${BLUE});border-radius:16px;padding:28px;color:${WHITE};margin-bottom:24px}
    .balance-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px}
    .balance-card{background:rgba(255,255,255,0.12);border-radius:10px;padding:14px}
    .balance-label{font-size:11px;font-weight:700;opacity:.75;text-transform:uppercase;letter-spacing:.5px}
    .balance-val{font-size:20px;font-weight:900;margin-top:4px}
    .portal-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
    .portal-tab{padding:8px 18px;border-radius:8px;border:2px solid #C8D4E8;background:${WHITE};font-size:13px;font-weight:600;cursor:pointer;color:${NAVY};font-family:inherit;transition:all .2s}
    .portal-tab.active{background:${BLUE};border-color:${BLUE};color:${WHITE}}
    .status-pill{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}
    .pill-active{background:#DCFCE7;color:${GREEN}}
    .pill-pending{background:#FEF9C3;color:#92400E}
    .pill-inactive{background:#FEE2E2;color:${ERROR}}
    .pill-approved{background:#DBEAFE;color:${BLUE}}
    .admin-wrap{max-width:1200px;margin:0 auto;padding:32px 20px}
    .admin-header{background:linear-gradient(135deg,${NAVY},${BLUE});border-radius:16px;padding:24px 28px;color:${WHITE};margin-bottom:24px}
    .admin-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
    .admin-tab{padding:8px 18px;border-radius:8px;border:2px solid #C8D4E8;background:${WHITE};font-size:13px;font-weight:600;cursor:pointer;color:${NAVY};font-family:inherit;transition:all .2s}
    .admin-tab.active{background:${NAVY};border-color:${NAVY};color:${WHITE}}
    .table-wrap{background:${WHITE};border-radius:12px;overflow:hidden;border:1px solid #D0DAED;box-shadow:0 2px 8px rgba(13,33,55,0.06)}
    .table-head{background:${BLUE_LIGHT};padding:12px 16px;font-size:11px;font-weight:700;color:${NAVY};text-transform:uppercase;letter-spacing:.5px}
    .table-row{padding:14px 16px;border-top:1px solid #EBF0F8;font-size:13px;align-items:center}
    .table-row:hover{background:#F7FAFF}
    .link-box{background:${BLUE_LIGHT};border:1.5px solid #A8C0DC;border-radius:10px;padding:16px;word-break:break-all;font-size:13px;color:${NAVY};margin-bottom:12px}
    .info-box{background:${GOLD_LIGHT};border:1.5px solid ${GOLD};border-radius:10px;padding:16px;margin-bottom:16px}
    .warn-box{background:#FEE2E2;border:1px solid #FCA5A5;border-radius:8px;padding:14px;margin-bottom:16px;font-size:12px;color:${ERROR};line-height:1.7}
    .cta-section{background:linear-gradient(135deg,${NAVY},${BLUE});padding:64px 24px;text-align:center;color:${WHITE}}
    .footer{background:${NAVY};color:rgba(255,255,255,0.7);padding:32px 24px;text-align:center;font-size:13px;line-height:1.8}
    @media(max-width:600px){.balance-grid{grid-template-columns:1fr}.dist-row{grid-template-columns:1fr 1fr}.how-grid{grid-template-columns:1fr}}
  `;

  const allArr = Object.values(members);
  const activeArr = allArr.filter(m=>m.status==="active");
  const pendingArr = allArr.filter(m=>m.status==="pending");

  return (
    <>
      <style>{css}</style>
      {note && <div className={`notification ${note.type==="error"?"note-error":"note-success"}`}>{note.msg}</div>}

      {/* NAV */}
      <nav className="nav">
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setView("landing")}>
          <div className="nav-logo">CFB</div>
          <div>
            <div className="nav-name">CoFundBills</div>
            <div className="nav-sub">Cooperative</div>
          </div>
        </div>
        <div className="nav-links">
          {currentMember ? (
            <>
              <button className="nav-btn" onClick={()=>{setPortalTab("overview");setView("portal");}}>My Portal</button>
              <button className="nav-btn" onClick={()=>{setCurrentMember(null);setView("landing");}}>Log Out</button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={()=>setModal({type:"login"})}>Log In</button>
              <button className="nav-btn nav-btn-gold" onClick={()=>{setTcAccepted(false);setShowTC(true);}}>Join Free</button>
            </>
          )}
          <button style={{opacity:.12,fontSize:10,padding:"4px 8px",background:"none",border:"none",color:"white",cursor:"pointer"}}
            onClick={()=>{setAdminPwd("");setAdminPwdErr("");setModal({type:"admin_login"});}}>
            [ADM]
          </button>
        </div>
      </nav>

      {/* T&C VIEW */}
      {showTC && (
        <div style={{padding:"40px 24px",background:"#F0F4FA",minHeight:"80vh"}}>
          <div style={{background:WHITE,borderRadius:16,padding:40,maxWidth:800,margin:"0 auto",boxShadow:"0 4px 32px rgba(13,33,55,0.08)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <button onClick={()=>setShowTC(false)} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button>
              <button onClick={()=>{setShowTC(false);setView("landing");}} style={{background:BLUE_LIGHT,border:`1px solid ${BLUE}`,color:BLUE,cursor:"pointer",fontSize:12,fontWeight:700,padding:"5px 14px",borderRadius:8,fontFamily:"inherit"}}>🏠 Home</button>
            </div>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:22,fontWeight:900,color:NAVY,marginBottom:4}}>Terms & Conditions</div>
              <div style={{fontSize:13,color:MUTED}}>{COMPANY}<br/>Operated by RoyalTech Partnership & Investment Limited</div>
            </div>
            <div className="warn-box">
              <strong>⚠️ Legal Notice:</strong> CoFundBills is NOT an insurance company, financial investment scheme, pyramid scheme, or MLM organisation. Monthly contributions are NOT insurance premiums or investment capital. Credits distributed are contributed funds redistributed through a network algorithm — not dividends or investment returns. Participation is voluntary and at your own discretion.
            </div>
            {TC_SECTIONS.map((sec,i)=>(
              <div key={i} style={{marginBottom:20,paddingBottom:20,borderBottom:i<TC_SECTIONS.length-1?"1px solid #F3F4F6":"none"}}>
                <div style={{fontWeight:800,fontSize:14,color:NAVY,marginBottom:8}}>{sec.title}</div>
                {sec.body&&<div style={{fontSize:13,color:"#374151",lineHeight:1.85}}>{sec.body}</div>}
                {sec.items&&sec.items.map((item,j)=>(
                  <div key={j} style={{display:"flex",gap:10,marginBottom:8,fontSize:13,color:"#374151",lineHeight:1.75}}>
                    <span style={{color:BLUE,fontWeight:700,flexShrink:0}}>{i+1}.{j+1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{background:BLUE_LIGHT,borderRadius:10,padding:16,display:"flex",alignItems:"center",gap:12,marginTop:8}}>
              <input type="checkbox" id="tc_check" style={{width:18,height:18,cursor:"pointer"}} checked={tcAccepted} onChange={e=>setTcAccepted(e.target.checked)}/>
              <label htmlFor="tc_check" style={{fontSize:13,color:NAVY,cursor:"pointer",lineHeight:1.6}}>
                I have read and agree to the CoFundBills Cooperative Terms & Conditions.
              </label>
            </div>
            <button className="btn btn-blue" style={{width:"100%",marginTop:16,fontSize:15,padding:14}} disabled={!tcAccepted}
              onClick={()=>{setShowTC(false);setView("register");}}>
              Accept & Continue to Registration
            </button>
          </div>
        </div>
      )}

      {/* LANDING */}
      {view==="landing" && !showTC && (
        <>
          <div className="hero">
            <div style={{display:"inline-block",background:GOLD,color:NAVY,
              fontSize:16,fontWeight:900,padding:"10px 28px",borderRadius:30,
              marginBottom:20,letterSpacing:1,boxShadow:"0 4px 16px rgba(201,168,76,0.4)"}}>
              🤝 {COMPANY}
            </div>
            <h1 className="hero-title">Don't Face Bills Alone.<br/><span>Let's Co-Fund Them.</span></h1>
            <p className="hero-sub">CoFundBills Cooperative — Your One-stop Solution to Excruciating Bills</p>
            <div className="hero-steps">
              {["JOIN","→","CONTRIBUTE","→","BUILD NETWORK","→","REQUEST","→","CASH-OUT"].map((s,i)=>(
                s==="→"
                  ? <div key={i} className="hero-step-arrow">{s}</div>
                  : <div key={i} className="hero-step">{s}</div>
              ))}
            </div>
            <div className="hero-btns">
              <button className="btn btn-gold btn-lg" onClick={()=>{setTcAccepted(false);setShowTC(true);}}>Join Free Today</button>
              <button className="btn btn-outline btn-lg" onClick={()=>setModal({type:"login"})}>Log In to My Portal</button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="stats-bar">
            {[["Pay ₦10,000","Monthly Contribution"],["Receive ₦2,000 Monthly","per directly invited contributor when they make their monthly contribution"],["Receive ₦2,000 Monthly","per indirectly invited contributor when they make their monthly contribution"],["Receive ₦2,000 Monthly","per Circuitously invited contributor when they make their monthly contribution"],["1%–4%","Co-Fund Loan Rate/Month"],["50/50","Expendable / Reserve Split"]].map(([v,l])=>(
              <div key={l} className="stat-item"><div className="stat-val">{v}</div><div className="stat-lbl">{l}</div></div>
            ))}
          </div>

          {/* How it works */}
          <div className="section">
            <h2 className="section-title">How CoFundBills Works</h2>
            <p className="section-sub">Five simple steps to collective bill financing — powered by your network.</p>
            <div className="how-grid">
              {[
                ["🚀","Join & Activate Two CoFund Accounts","With your first ₦10,000 contribution, unlock your personal Invite Link and activate two accounts: (your Expendable CoFund Account and your Fixed Savings CoFund Account). Share your invite link and grow your network of contributors."],
                ["💳","Receive ₦2,000 Per Directly Invited Contributor","For every monthly contribution made by a member from your direct invite network — ₦2,000 is split and credited into your two CoFund Accounts."],
                ["🔗","Receive ₦2,000 Per Indirectly Invited Contributor","When members from your direct invite share their personal invite link and grow their own network — your CoFund Account is again credited with ₦2,000 for every monthly contribution made by contributors from their network."],
                ["🌐","Receive ₦2,000 Per Circuitously Invited Contributor","When members from your indirect invite share their personal invite link and grow their own network — your CoFund Account is further credited with ₦2,000 for every monthly contribution made by contributors from these networks."],
                ["💸","Cash Out from Your Expendable CoFund Account Anytime","Make cash withdrawals from your Expendable CoFund Account at any time for any purpose. Subject to admin processing within 24 hours."],
                ["🏦","Cash Out from Fixed Savings CoFund Account for Essential Bills Only","Access your Fixed Savings CoFund Account for essential bills only — House Rent, School Fees, Medical Bills, and similar critical expenses."],
              ].map(([icon,title,desc],i)=>(
                <div key={title} className="how-card">
                  <div className="how-num">{i+1}</div>
                  <div className="how-icon">{icon}</div>
                  <div className="how-title">{title}</div>
                  <div className="how-desc">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div style={{background:WHITE,padding:"48px 24px",borderTop:"1px solid #E8F0FA"}}>
            <div style={{maxWidth:760,margin:"0 auto"}}>
              <h2 className="section-title">See How Your Essential Bills Get Sorted</h2>
              <p className="section-sub">A simple illustration of how your CoFundBills network works for you over time.</p>
              <div style={{background:BLUE_LIGHT,borderRadius:14,padding:28}}>
                {/* Step 0 — You */}
                <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:20,
                  borderLeft:`4px solid ${GOLD}`,display:"flex",alignItems:"center",gap:16}}>
                  <div style={{fontSize:28,fontWeight:900,color:GOLD,minWidth:40,textAlign:"center"}}>1</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:NAVY,fontSize:14}}>You Join & Contribute ₦10,000 Monthly</div>
                    <div style={{fontSize:12,color:MUTED,marginTop:2}}>
                      Stay active and ready to receive credits from your growing network of contributors.
                    </div>
                  </div>
                </div>

                {/* Tier 1 — Direct */}
                <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:20,
                  borderLeft:`4px solid ${BLUE}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <div style={{fontSize:36,fontWeight:900,color:BLUE,minWidth:48,textAlign:"center"}}>10</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:NAVY,fontSize:14}}>Your Direct Invites</div>
                      <div style={{fontSize:12,color:MUTED,marginTop:2,lineHeight:1.7}}>
                        Let's assume you are able to get 10 invites to join the cooperative through your invite link shared = 10 contributors × ₦2,000 = <strong style={{color:BLUE}}>₦20,000 credited to your account monthly</strong>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:900,color:BLUE}}>₦20,000</div>
                      <div style={{fontSize:10,color:MUTED}}>per month</div>
                    </div>
                  </div>
                </div>

                {/* Tier 2 — Indirect */}
                <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:20,
                  borderLeft:`4px solid ${NAVY}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <div style={{fontSize:36,fontWeight:900,color:NAVY,minWidth:48,textAlign:"center"}}>100</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:NAVY,fontSize:14}}>Their Invites (Indirect)</div>
                      <div style={{fontSize:12,color:MUTED,marginTop:2,lineHeight:1.7}}>
                        Imagine all 10 invites from your personal Invite Links have unlocked and shared their own invite links and have likewise brought in 10 invites each to join the cooperative = 100 contributors × ₦2,000 = <strong style={{color:NAVY}}>₦200,000 credited to your account monthly from your indirect contributor network</strong>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:900,color:NAVY}}>₦200,000</div>
                      <div style={{fontSize:10,color:MUTED}}>per month</div>
                    </div>
                  </div>
                </div>

                {/* Tier 3 — Extended */}
                <div style={{background:WHITE,borderRadius:10,padding:16,marginBottom:20,
                  borderLeft:`4px solid #0A3860`}}>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <div style={{fontSize:36,fontWeight:900,color:"#0A3860",minWidth:48,textAlign:"center"}}>1,000</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:NAVY,fontSize:14}}>Circuitously Invited Contributors</div>
                      <div style={{fontSize:12,color:MUTED,marginTop:2,lineHeight:1.7}}>
                        Here is where the magic happens — By the time these 100 Indirect invites develop their respective network with just 10 invites each, you will have 1,000 contributors × ₦2,000 = <strong style={{color:"#0A3860"}}>₦2,000,000 credited to your account monthly from contributors you don't even know nationwide</strong>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:20,fontWeight:900,color:"#0A3860"}}>₦2,000,000</div>
                      <div style={{fontSize:10,color:MUTED}}>per month</div>
                    </div>
                  </div>
                </div>
                <div style={{background:GOLD_LIGHT,border:`2px solid ${GOLD}`,borderRadius:10,padding:16,marginTop:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontWeight:800,color:NAVY,fontSize:15}}>Total Monthly Credit (Illustrative)</div>
                      <div style={{fontSize:12,color:MUTED,marginTop:2}}>10 direct + 100 indirect + 1,000 extended contributors</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:26,fontWeight:900,color:NAVY}}>₦2,220,000</div>
                      <div style={{fontSize:11,color:MUTED}}>₦1,110,000 Expendable + ₦1,110,000 Fixed Savings</div>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:12,color:MUTED,marginTop:12,textAlign:"center",fontStyle:"italic"}}>
                  * These are illustrative figures, but very realistic and achievable – because everyone is obliged to make their monthly contributions and at the same time, self-motivated to develop their network of monthly contributors to boost their earnings and credit score. However, actual earnings depend entirely on your network members' responsiveness to monthly contributions.
                </div>
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div style={{background:WHITE,padding:"48px 24px"}}>
            <div style={{maxWidth:900,margin:"0 auto"}}>
              <h2 className="section-title">How Every ₦10,000 Contribution is Distributed</h2>
              <p className="section-sub">Every contribution is split equally into 5 parts of ₦2,000 each — transparent, fair, and automatic.</p>
              <div className="dist-row">
                {[
                  ["Credit Per Direct Invites","₦2,000","Credited to the member whose direct invite link brought in this contributor"],
                  ["Credit Per Indirect Invites","₦2,000","Credited to the member whose indirect invite is associated with this contributor"],
                  ["Credit Per Circuitously Invited Contributor","₦2,000","Credited to the member whose circuitously circulated invite can be traced to this contributor"],
                  ["Admin Operations","₦2,000","Platform operational & maintenance cost, administrative running cost, staff wages and associated consultant fees."],
                  ["Loan Fund Pool","₦2,000","Funds the Co-Fund loan pool available to members. Forfeited credits from inactive membership status also go here."],
                ].map(([label,amt,desc])=>(
                  <div key={label} className="dist-cell">
                    <div className="dist-label">{label}</div>
                    <div className="dist-amt">{amt}</div>
                    <div className="dist-desc">{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:20,background:BLUE_LIGHT,borderRadius:12,padding:20,textAlign:"center",fontSize:13,color:NAVY,lineHeight:1.8}}>
                Every credit you receive is automatically split <strong>50% Expendable</strong> (cashable on demand) and <strong>50% Reserve</strong> (for essential bills only). Your incoming network credits are also applied automatically to any outstanding Co-Fund loan repayments before crediting your account.
              </div>
            </div>
          </div>

          {/* Accounts */}
          <div className="section">
            <h2 className="section-title">Your Two Co-Fund Accounts</h2>
            <p className="section-sub">Every credit you earn is automatically split — keeping you both liquid and prepared.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:700,margin:"0 auto"}}>
              {[
                {icon:"💸",title:"Expendable Account",color:BLUE,desc:"50% of every credit. Request a cashout anytime for any purpose. Subject to admin approval and processed within 24 hours."},
                {icon:"🏦",title:"Reserve Account",color:NAVY,desc:"50% of every credit. Accumulates as your dedicated bill financing reserve — for rent, school fees, medical bills, and essential expenses. Cannot be used for general spending."},
              ].map(b=>(
                <div key={b.title} className="card" style={{textAlign:"center",borderTop:`4px solid ${b.color}`}}>
                  <div style={{fontSize:40,marginBottom:12}}>{b.icon}</div>
                  <div style={{fontWeight:800,fontSize:16,color:NAVY,marginBottom:8}}>{b.title}</div>
                  <div style={{fontSize:13,color:MUTED,lineHeight:1.7}}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Co-Fund Loan */}
          <div style={{background:WHITE,padding:"48px 24px"}}>
            <div style={{maxWidth:800,margin:"0 auto"}}>
              <h2 className="section-title">The Co-Fund Loan</h2>
              <p className="section-sub">Face a big bill? Your network is your credit score.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[
                  {icon:"📊",title:"Loan Limit",desc:"Based on your network's projected contributions — Partners: 6 months, Founding Members: 5 months, Premium: 4 months, Regular: 3 months. With a well developed network as illustrated above, a Regular member can borrow up to ₦2,220,000 × 3 months = ₦6,660,000, while a Partner can borrow up to ₦2,220,000 × 6 months = ₦13,320,000."},
                  {icon:"💰",title:"Loan Rate",desc:"1% for Partners, 2% for Founding Members, 3% for Premium Members, 4% for Regular Members — per month, fair, transparent, and fully disclosed upfront."},
                  {icon:"🔄",title:"Auto Repayment",desc:"Repayments are automatically deducted from incoming network credits. No manual transfers, no stress."},
                  {icon:"📈",title:"Investor Package",desc:"1. Take loans at a diminished interest rate of 1% per month.\n2. Investors are root participants with no predecessors — they receive ₦6,000 from direct invite contributions, ₦4,000 from indirect invite contributions, and ₦2,000 from circuitously invited members contributions.\n3. Loan interest proceeds are distributed monthly to Partners/Invested members equally across the 10 slots."},
                ].map(c=>(
                  <div key={c.title} className="card" style={{padding:20}}>
                    <div style={{fontSize:28,marginBottom:8}}>{c.icon}</div>
                    <div style={{fontWeight:700,color:NAVY,marginBottom:6,fontSize:14}}>{c.title}</div>
                    <div style={{fontSize:13,color:MUTED,lineHeight:1.7,whiteSpace:"pre-line"}}>{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="cta-section">
            <h2 style={{fontSize:"clamp(22px,3vw,36px)",fontWeight:900,marginBottom:12}}>Ready to Co-Fund Your Bills?</h2>
            <p style={{fontSize:15,opacity:.85,maxWidth:560,margin:"0 auto 28px",lineHeight:1.7}}>
              Join free today. Start contributing ₦10,000 monthly to build your network and your bill financing power — collectively.
            </p>
            <button className="btn btn-gold btn-lg" onClick={()=>{setTcAccepted(false);setShowTC(true);}}>Join CoFundBills Free</button>
          </div>

          <div className="footer">
            <div style={{fontWeight:900,color:WHITE,fontSize:16,marginBottom:4}}>{COMPANY}</div>
            <div style={{fontStyle:"italic",color:"rgba(255,255,255,0.5)",marginBottom:8}}>"{TAGLINE}"</div>
            <div>{ADDRESS}</div>
            <div>Email: {EMAIL_ADDR} | Phone: {PHONE} | {WEBSITE}</div>
            <div style={{marginTop:12,fontSize:11,opacity:.5}}>
              © 2026 {COMPANY}. All rights reserved. CoFundBills is a cooperative and is not an insurance company, financial institution, or investment scheme.
            </div>
            <div style={{marginTop:8}}>
              <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",textDecoration:"underline",fontSize:12}}
                onClick={()=>{setTcAccepted(false);setShowTC(true);}}>Terms & Conditions</button>
              {" | "}
              <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.6)",cursor:"pointer",textDecoration:"underline",fontSize:12}}
                onClick={()=>{setTcAccepted(false);setShowTC(true);}}>Legal Disclaimer</button>
            </div>
          </div>
        </>
      )}

      {/* REGISTER */}
      {view==="register" && (
        <div style={{padding:"40px 24px",background:"#F0F4FA",minHeight:"80vh"}}>
          <div className="card" style={{maxWidth:560,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <button onClick={()=>setView("landing")} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button>
              <button onClick={()=>setView("landing")} style={{background:BLUE_LIGHT,border:`1px solid ${BLUE}`,color:BLUE,cursor:"pointer",fontSize:12,fontWeight:700,padding:"5px 14px",borderRadius:8,fontFamily:"inherit"}}>🏠 Home</button>
            </div>
            <div className="modal-title">Join CoFundBills Cooperative</div>
            <div className="modal-sub">Free registration. Activate your Co-Fund Regular Membership Status with ₦10,000 first monthly contribution. Or Premium Membership Status with ₦100,000 first yearly contribution.</div>
            {urlRef && <div className="info-box" style={{fontSize:13,color:NAVY}}>🔗 Referred by: <strong>{urlRef}</strong></div>}
            {regErrors.general&&<div className="warn-box">{regErrors.general}</div>}

            {/* Membership Type */}
            <div className="field">
              <label>Membership Type</label>
              <select value={regForm.memberType||"regular"} onChange={e=>setRegForm({...regForm,memberType:e.target.value})}>
                <option value="regular">Regular Member — ₦10,000 monthly contribution</option>
                <option value="premium">Premium Member — ₦100,000 yearly contribution</option>
              </select>
            </div>

            {/* Personal Details */}
            <div style={{fontWeight:700,color:NAVY,fontSize:13,marginBottom:8,marginTop:8,borderBottom:`1px solid ${BLUE_LIGHT}`,paddingBottom:6}}>Personal Details</div>
            {[["fullName","Full Name","text","Your legal full name"],["email","Email Address","email",""],["phone","Phone Number","tel","e.g. 08012345678"],["occupation","Occupation / Employer","text",""],["address","Residential Address","text","Your full home address"],["state","State of Residence","text",""]].map(([key,label,type,ph])=>(
              <div className="field" key={key}>
                <label>{label}</label>
                <input type={type} placeholder={ph} className={regErrors[key]?"field-err":""} value={regForm[key]} onChange={e=>setRegForm({...regForm,[key]:e.target.value})}/>
                {regErrors[key]&&<div className="err-msg">{regErrors[key]}</div>}
              </div>
            ))}
            <div className="field">
              <label>Country</label>
              <select value={regForm.country} onChange={e=>setRegForm({...regForm,country:e.target.value})}>
                {["Nigeria","Ghana","Kenya","United Kingdom","United States","Canada","Other"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Valid ID Upload */}
            <div style={{fontWeight:700,color:NAVY,fontSize:13,marginBottom:8,marginTop:16,borderBottom:`1px solid ${BLUE_LIGHT}`,paddingBottom:6}}>Valid ID</div>
            <div className="field">
              <label>Upload Valid ID (NIN, Voter's Card, Driver's Licence, Int'l Passport)</label>
              <input type="file" accept="image/*,application/pdf"
                onChange={e=>setRegForm({...regForm,validId:e.target.files[0]})}
                style={{padding:"8px 0",border:"none",fontSize:13}}/>
              <div style={{fontSize:11,color:MUTED,marginTop:4}}>Accepted: JPG, PNG, PDF. Max 5MB.</div>
              {regErrors.validId&&<div className="err-msg">{regErrors.validId}</div>}
            </div>

            {/* Next of Kin */}
            <div style={{fontWeight:700,color:NAVY,fontSize:13,marginBottom:8,marginTop:16,borderBottom:`1px solid ${BLUE_LIGHT}`,paddingBottom:6}}>Next of Kin</div>
            {[["nokName","Full Name","text",""],["nokPhone","Phone Number","tel",""],["nokRelationship","Relationship","text","e.g. Spouse, Sibling, Parent"]].map(([key,label,type,ph])=>(
              <div className="field" key={key}>
                <label>{label}</label>
                <input type={type} placeholder={ph} className={regErrors[key]?"field-err":""} value={regForm[key]} onChange={e=>setRegForm({...regForm,[key]:e.target.value})}/>
                {regErrors[key]&&<div className="err-msg">{regErrors[key]}</div>}
              </div>
            ))}

            {/* Bank Details */}
            <div style={{fontWeight:700,color:NAVY,fontSize:13,marginBottom:8,marginTop:16,borderBottom:`1px solid ${BLUE_LIGHT}`,paddingBottom:6}}>Cash-Out Bank Details</div>
            {[["bankName","Bank Name","text","e.g. Zenith Bank, GTBank"],["accountName","Account Name","text","As registered with your bank"],["accountNumber","Account Number","text","10-digit account number"]].map(([key,label,type,ph])=>(
              <div className="field" key={key}>
                <label>{label}</label>
                <input type={type} placeholder={ph} className={regErrors[key]?"field-err":""} value={regForm[key]} onChange={e=>setRegForm({...regForm,[key]:e.target.value})}/>
                {regErrors[key]&&<div className="err-msg">{regErrors[key]}</div>}
              </div>
            ))}
            <div className="info-box">
              <div style={{fontWeight:700,color:NAVY,marginBottom:8}}>After Registration — Activate Your Co-Fund membership status and unlock your Personal Invite Link:</div>
              <div style={{fontSize:13,color:NAVY,lineHeight:1.8,marginBottom:12}}>
                Pay <strong>₦10,000</strong> first monthly contribution to activate your <strong>Regular Membership Status.</strong><br/>
                <span style={{color:MUTED}}>— OR —</span><br/>
                Pay <strong>₦100,000</strong> first yearly contribution to activate your <strong>Premium Membership Status.</strong>
              </div>
              <div style={{background:WHITE,border:`1.5px solid ${GOLD}`,borderRadius:8,
                padding:12,fontSize:13,color:NAVY,lineHeight:1.9}}>
                <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                Account Number: <strong>1016621205</strong> | Bank: <strong>Zenith Bank</strong><br/>
                Reference: Your name + CFB<br/>
                Then WhatsApp: <strong>+234 909 999 4816</strong>
              </div>
            </div>
            <div className="warn-box">
              <strong>⚠️ One account per person.</strong> Duplicate registrations result in suspension and permanent forfeiture of all credits. All information must be true and verifiable.
            </div>
            <div style={{background:BLUE_LIGHT,border:"1px solid #A8C0DC",borderRadius:8,padding:14,marginBottom:16,display:"flex",alignItems:"flex-start",gap:12}}>
              <input type="checkbox" id="reg_tc" style={{width:18,height:18,marginTop:2,cursor:"pointer",flexShrink:0}} checked={tcAccepted} onChange={e=>setTcAccepted(e.target.checked)}/>
              <label htmlFor="reg_tc" style={{fontSize:13,color:NAVY,cursor:"pointer",lineHeight:1.6}}>
                I have read and agree to the{" "}
                <button type="button" style={{background:"none",border:"none",color:BLUE,fontWeight:700,cursor:"pointer",fontSize:13,padding:0,textDecoration:"underline"}}
                  onClick={()=>setShowTC(true)}>CoFundBills Terms & Conditions</button>.
                CoFundBills is not an insurance plan, investment scheme, or MLM.
              </label>
            </div>
            <button className="btn btn-blue" style={{width:"100%"}} disabled={!tcAccepted} onClick={handleRegister}>Join CoFundBills Free</button>
          </div>
        </div>
      )}

      {/* PORTAL */}
      {view==="portal" && currentMember && (
        <div className="portal-wrap">
          <div className="portal-header" style={{background:`linear-gradient(135deg,${getTier(currentMember.memberType).bgDark},${getTier(currentMember.memberType).bg})`}}>
            {/* Tier colour streak at top */}
            <div style={{height:4,background:getTier(currentMember.memberType).accent,borderRadius:"12px 12px 0 0",margin:"-28px -28px 20px -28px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontWeight:900,fontSize:22}}>{currentMember.fullName}</div>
                <div style={{fontSize:13,opacity:.75,marginTop:4}}>Co-Fund Link Code: {currentMember.linkCode}</div>
                <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <span className={`status-pill ${currentMember.status==="active"?"pill-active":currentMember.status==="inactive"?"pill-inactive":"pill-pending"}`}>
                    {currentMember.status==="active"?"✅ Active":currentMember.status==="inactive"?"⛔ Inactive":"⏳ Pending"}
                  </span>
                  {(currentMember.memberType==="partner"||currentMember.memberType==="admin")&&(
                    <span style={{fontSize:11,background:"rgba(201,168,76,0.3)",color:GOLD,padding:"2px 8px",borderRadius:10,fontWeight:700}}>
                      {getTier(currentMember.memberType).badge}{" "}
                      {currentMember.memberType==="admin"
                        ? (currentMember.investorSlot===2?"Co-Admin":"President / Admin")
                        : "Partner / Invested Member"}
                    </span>
                  )}
                  {currentMember.memberType==="founding"&&(
                    <span style={{fontSize:11,background:TIER.founding.light,color:TIER.founding.bg,padding:"2px 8px",borderRadius:10,fontWeight:700}}>
                      🎖️ Founding Member — Permanently Active
                    </span>
                  )}
                  {/* Timer — Regular (monthly) and Premium (yearly) only */}
                  {currentMember.memberType==="admin"&&(
                    <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:8,
                      background:"rgba(201,168,76,0.2)",borderRadius:8,padding:"6px 14px"}}>
                      <span style={{fontSize:12,fontWeight:700,color:GOLD}}>🛡️ {currentMember.investorSlot===2?"Co-Admin":"President / Admin"} — Permanent Status</span>
                    </div>
                  )}
                  {currentMember.memberType==="partner"&&(
                    <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:8,
                      background:"rgba(201,168,76,0.2)",borderRadius:8,padding:"6px 14px"}}>
                      <span style={{fontSize:12,fontWeight:700,color:GOLD}}>👑 Partner/Invested Member — Contract Period Active</span>
                    </div>
                  )}
                  {currentMember.memberType==="founding"&&(
                    <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:8,
                      background:TIER.founding.light,borderRadius:8,padding:"6px 14px"}}>
                      <span style={{fontSize:12,fontWeight:700,color:TIER.founding.bg}}>🎖️ Founding Member — Permanently Active | Eligible to upgrade to Partner when slot available</span>
                    </div>
                  )}
                  {(currentMember.memberType==="regular"||currentMember.memberType==="premium")&&currentMember.expiresAt&&(
                    <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:8,
                      background:countdown==="EXPIRED"?"rgba(159,18,57,0.25)":
                        countdown.startsWith("0d")||countdown.startsWith("1d")||countdown.startsWith("2d")?
                        "rgba(234,179,8,0.25)":"rgba(255,255,255,0.12)",
                      borderRadius:8,padding:"6px 14px"}}>
                      <span style={{fontSize:11,opacity:.75}}>
                        {currentMember.memberType==="premium"?"Yearly contribution expires in:":currentMember.memberType==="founding"?"Term contribution expires in:":"Monthly contribution expires in:"}
                      </span>
                      <span style={{fontSize:13,fontWeight:900,letterSpacing:1,
                        color:countdown==="EXPIRED"?"#FCA5A5":
                          countdown.startsWith("0d")||countdown.startsWith("1d")||countdown.startsWith("2d")?
                          "#FDE68A":WHITE}}>
                        ⏱ {countdown||"Loading..."}
                      </span>
                    </div>
                  )}
                </div>
                {currentMember.loanBalance>0&&(
                  <div style={{marginTop:8,background:"rgba(159,18,57,0.2)",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#FCA5A5"}}>
                    ⚠️ Outstanding Loan: <strong>{fmtNGN(currentMember.loanBalance)}</strong> — being repaid automatically from network credits
                  </div>
                )}
              </div>
              <button className="btn btn-outline btn-sm" onClick={()=>{setCurrentMember(null);setView("landing");}}>Log Out</button>
            </div>
            <div className="balance-grid">
              <div className="balance-card" style={{borderTop:`3px solid ${getTier(currentMember.memberType).accent}`}}>
                <div className="balance-label">💸 Expendable</div>
                <div className="balance-val">{fmtNGN(currentMember.expendable)}</div>
                <div style={{fontSize:11,opacity:.65,marginTop:2}}>Available for cashout</div>
              </div>
              <div className="balance-card">
                <div className="balance-label">🏦 Reserve</div>
                <div className="balance-val">{fmtNGN(currentMember.reserve)}</div>
                <div style={{fontSize:11,opacity:.65,marginTop:2}}>Essential bills only</div>
              </div>
              <div className="balance-card">
                <div className="balance-label">📊 Total Credited</div>
                <div className="balance-val">{fmtNGN(currentMember.totalCredited)}</div>
                <div style={{fontSize:11,opacity:.65,marginTop:2}}>Lifetime earnings</div>
              </div>
            </div>
          </div>

          <div className="portal-tabs">
            {[["home","🏠"],["overview","Overview"],["link","My Invite Link"],["credits","Credits"],["cashout","Cash Out"],["loan","Co-Fund Loan"],
              ...( currentMember.memberType==="regular"?[["renew","Renew Monthly Contribution"]]:currentMember.memberType==="premium"?[["renew","Renew Yearly Contribution"]]:[] )
            ].map(([id,label])=>(
              <button key={id}
                className={`portal-tab${portalTab===id?" active":""}`}
                style={portalTab===id?{background:getTier(currentMember.memberType).bg,borderColor:getTier(currentMember.memberType).bg,color:WHITE}:{}}
                onClick={()=>{
                setPortalTab(id);
                if(id==="loan"&&currentMember){
                  const {direct,indirect,extended}=getNetworkCounts(currentMember.linkCode);
                  setLoanCalc({directInput:direct,indirectInput:indirect,extendedInput:extended});
                }
              }}>{label}</button>
            ))}
          </div>

          {portalTab==="home" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:48,marginBottom:12}}>🤝</div>
              <div style={{fontWeight:900,fontSize:20,color:NAVY,marginBottom:8}}>{COMPANY}</div>
              <div style={{fontStyle:"italic",color:MUTED,fontSize:14,marginBottom:24}}>"{TAGLINE}"</div>
              <button className="btn btn-blue btn-lg" style={{marginBottom:12}} onClick={()=>{setCurrentMember(null);setView("landing");}}>Go to Home Page</button>
              <div style={{fontSize:12,color:MUTED,marginTop:16,lineHeight:1.8}}>{ADDRESS}<br/>{EMAIL_ADDR} | {PHONE}</div>
            </div>
          )}

          {portalTab==="overview" && (
            <div className="card">
              <div style={{fontWeight:800,fontSize:16,color:NAVY,marginBottom:16}}>Account Summary</div>
              {[["Total Credited",fmtNGN(currentMember.totalCredited)],["Expendable Balance",fmtNGN(currentMember.expendable)],["Reserve Balance",fmtNGN(currentMember.reserve)],["Outstanding Loan",fmtNGN(currentMember.loanBalance)],["Member Type",getTier(currentMember.memberType).badge+" "+( currentMember.memberType==="admin"?(currentMember.investorSlot===2?"Co-Admin":"President / Admin"):currentMember.memberType==="partner"?"Partner / Invested Member":currentMember.memberType==="founding"?"Founding Member":currentMember.memberType==="premium"?"Invited Member (Premium)":"Invited Member (Regular)")],["Status",currentMember.status],["Member Since",currentMember.createdAt?new Date(currentMember.createdAt).toLocaleDateString("en-NG"):"—"],
              ...(currentMember.memberType==="admin"?[["Status","Permanent — No Expiry"]]:currentMember.memberType==="partner"?[["Status","Active Contract Period"],["Note","Enlistment/Dis-enlistment by Admin only"]]:currentMember.memberType==="founding"?[["Membership Type","🎖️ Founding Member (25-slot limited)"],["Status","Permanently Active — No Contribution Required"],["Upgrade Path","Eligible to upgrade to Partner/Investor when slot is available"],["Note","Founding Member status is preserved even if Partner contract lapses"]]:currentMember.expiresAt?[["Membership Expires",new Date(currentMember.expiresAt).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"})],["Time Remaining",countdown||"—"]]:[])]
              .map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #EBF0F8",fontSize:14}}>
                  <span style={{color:MUTED}}>{k}</span>
                  <span style={{fontWeight:700,color:NAVY}}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {portalTab==="link" && (
            <div className="card">
              <div style={{fontWeight:800,fontSize:16,color:NAVY,marginBottom:12}}>Your Co-Fund Invite Link</div>
              {!currentMember.linkActive ? (
                <div className="info-box">
                  <div style={{fontWeight:700,color:NAVY,marginBottom:6}}>🔒 Link Not Active</div>
                  <div style={{fontSize:13,color:NAVY,lineHeight:1.8}}>
                    Pay ₦10,000 monthly contribution to activate your Co-Fund Link.<br/>
                    Royal Tech Partnership & Investment Limited<br/>
                    Zenith Bank — 1016621205 | Reference: {currentMember.linkCode}<br/>
                    WhatsApp: +234 909 999 4816
                  </div>
                </div>
              ):(
                <>
                  <div style={{fontSize:13,color:MUTED,marginBottom:10}}>
                    Share your Co-Fund Invite Link with everyone on your contact list.{" "}
                    {currentMember.memberType==="partner"||currentMember.memberType==="admin"
                      ? "As a root participant, you earn 60% from direct invite contributions, 40% from indirect, and 20% from circuitous invite contributions."
                      : "Every monthly contribution from your network earns you 20% of each contribution — up to 3 generations deep (Direct, Indirect and Circuitous invites)."}
                  </div>
                  <div className="link-box" style={{background:getTier(currentMember.memberType).light,borderColor:getTier(currentMember.memberType).accent}}>https://cofundbills.vercel.app?ref={currentMember.linkCode}</div>
                  <button className="btn btn-blue btn-sm" onClick={()=>{navigator.clipboard.writeText(`https://cofundbills.vercel.app?ref=${currentMember.linkCode}`);showNote("Link copied!");}}>Copy Link</button>
                </>
              )}
            </div>
          )}

          {portalTab==="credits" && (
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
                <span>Date</span><span>From</span><span>Level</span><span>Trigger</span><span>Amount</span>
              </div>
              {credits.length===0?<div style={{padding:32,textAlign:"center",color:MUTED}}>No credits yet. Share your link to start earning.</div>:credits.map((c,i)=>(
                <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
                  <div>{new Date(c.created_at).toLocaleDateString("en-NG")}</div>
                  <div style={{fontSize:12,color:MUTED}}>{c.source_code}</div>
                  <div><span className="status-pill pill-approved" style={{textTransform:"capitalize"}}>{c.level}</span></div>
                  <div style={{fontSize:11,textTransform:"capitalize",color:MUTED}}>{c.trigger}</div>
                  <div style={{fontWeight:700,color:NAVY}}>{fmtNGN(c.amount)}</div>
                </div>
              ))}
            </div>
          )}

          {portalTab==="cashout" && (
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:15,color:NAVY,marginBottom:14}}>Request a Cashout</div>
                <div style={{fontSize:13,color:MUTED,marginBottom:16,lineHeight:1.8,background:BLUE_LIGHT,borderRadius:8,padding:12}}>
                  <strong>Expendable:</strong> {fmtNGN(currentMember.expendable)} available — any purpose<br/>
                  <strong>Reserve:</strong> {fmtNGN(currentMember.reserve)} available — essential bills only (rent, school fees, medical)
                </div>
                <div className="field">
                  <label>Account Type</label>
                  <select value={cashoutForm.type} onChange={e=>setCashoutForm({...cashoutForm,type:e.target.value})}>
                    <option value="expendable">Expendable Account — Any Purpose</option>
                    <option value="reserve">Reserve Account — Essential Bills Only</option>
                  </select>
                </div>
                <div className="field">
                  <label>Amount (₦)</label>
                  <input type="number" placeholder="Enter amount" value={cashoutForm.amount} onChange={e=>setCashoutForm({...cashoutForm,amount:e.target.value})}/>
                </div>
                {cashoutForm.type==="reserve"&&(
                  <div className="field">
                    <label>Bill Purpose</label>
                    <input type="text" placeholder="e.g. House rent, School fees, Medical bill..." value={cashoutForm.purpose} onChange={e=>setCashoutForm({...cashoutForm,purpose:e.target.value})}/>
                  </div>
                )}
                {cashoutErr&&<div style={{color:ERROR,fontSize:13,marginBottom:10}}>{cashoutErr}</div>}
                <button className="btn btn-blue" style={{width:"100%"}} onClick={handleCashoutRequest}>Submit Cashout Request</button>
              </div>
              {cashouts.length>0&&(
                <div className="table-wrap">
                  <div className="table-head" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
                    <span>Date</span><span>Type</span><span>Purpose</span><span>Amount</span><span>Status</span>
                  </div>
                  {cashouts.map((c,i)=>(
                    <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
                      <div>{new Date(c.created_at).toLocaleDateString("en-NG")}</div>
                      <div style={{textTransform:"capitalize",fontSize:12}}>{c.type}</div>
                      <div style={{fontSize:11,color:MUTED}}>{c.purpose||"—"}</div>
                      <div style={{fontWeight:700}}>{fmtNGN(c.amount)}</div>
                      <div><span className={`status-pill ${c.status==="approved"?"pill-active":c.status==="rejected"?"pill-inactive":"pill-pending"}`}>{c.status}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {portalTab==="loan" && (
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:15,color:NAVY,marginBottom:12}}>Apply for a Co-Fund Loan</div>
                {currentMember.loanBalance>0?(
                  <div className="warn-box">You have an outstanding loan balance of <strong>{fmtNGN(currentMember.loanBalance)}</strong>. Please clear your existing loan before applying for a new one. Repayments are being automatically applied from your incoming network credits.</div>
                ):(
                  <>
                    {/* Loan Calculator */}
                    <div style={{background:BLUE_LIGHT,borderRadius:12,padding:20,marginBottom:20,border:`1.5px solid ${BLUE}`}}>
                      <div style={{fontWeight:800,color:NAVY,fontSize:14,marginBottom:12}}>🧮 Co-Fund Loan Calculator</div>
                      {(()=>{
                        const {direct,indirect,extended}=getNetworkCounts(currentMember.linkCode);
                        return(
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                            {[["Direct Invites",direct,BLUE],["Indirect Invites",indirect,NAVY],["Circuitous Invites",extended,"#0A3860"]].map(([label,count,color])=>(
                              <div key={label} style={{background:WHITE,borderRadius:8,padding:10,textAlign:"center",borderTop:`3px solid ${color}`}}>
                                <div style={{fontSize:22,fontWeight:900,color}}>{count}</div>
                                <div style={{fontSize:10,fontWeight:700,color:MUTED,marginTop:2}}>{label}</div>
                                <div style={{fontSize:10,color:MUTED}}>{count>0?"Active":"None yet"}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div style={{fontSize:12,color:MUTED,marginBottom:14,lineHeight:1.7}}>Your network figures are pre-filled below. You can adjust them to model different scenarios:</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                        {[["directInput","Direct Invites"],["indirectInput","Indirect Invites"],["extendedInput","Circuitous Invites"]].map(([key,label])=>(
                          <div key={key}>
                            <div style={{fontSize:11,fontWeight:700,color:NAVY,marginBottom:4}}>{label}</div>
                            <input type="number" placeholder="0" min="0"
                              value={loanCalc[key]||""}
                              onChange={e=>setLoanCalc({...loanCalc,[key]:Number(e.target.value)||0})}
                              style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${BLUE}`,borderRadius:8,fontSize:14,fontFamily:"inherit",outline:"none",color:DARK}}/>
                          </div>
                        ))}
                      </div>
                      {(()=>{
                        const total3mo=(loanCalc.directInput+loanCalc.indirectInput+loanCalc.extendedInput)*2000*3;
                        const rate=currentMember.memberType==="partner"?1:currentMember.memberType==="founding"?2:currentMember.memberType==="premium"?3:4;
                        const loanMonths=currentMember.memberType==="partner"?6:currentMember.memberType==="founding"?5:currentMember.memberType==="premium"?4:3;
                        const loanLimitCalc=total3mo/3*loanMonths;
                        const interest=loanLimitCalc*rate/100*loanMonths;
                        return total3mo>0?(
                          <div style={{background:WHITE,borderRadius:8,padding:14}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
                              <div style={{color:MUTED}}>3-Month Network Projection:</div>
                              <div style={{fontWeight:700,color:NAVY,textAlign:"right"}}>{fmtNGN(total3mo)}</div>
                              <div style={{color:MUTED}}>Estimated Loan Limit ({loanMonths}-month):</div>
                              <div style={{fontWeight:900,color:BLUE,fontSize:16,textAlign:"right"}}>{fmtNGN(loanLimitCalc)}</div>
                              <div style={{color:MUTED}}>Interest Rate:</div>
                              <div style={{fontWeight:700,color:NAVY,textAlign:"right"}}>{rate}% per month</div>
                              <div style={{color:MUTED}}>Total Repayable ({loanMonths} months):</div>
                              <div style={{fontWeight:700,color:ERROR,textAlign:"right"}}>{fmtNGN(loanLimitCalc+interest)}</div>
                            </div>
                          </div>
                        ):null;
                      })()}
                    </div>

                    <div style={{fontSize:13,color:MUTED,marginBottom:16,lineHeight:1.8,background:BLUE_LIGHT,borderRadius:8,padding:12}}>
                      Your loan limit is calculated from your network's projected 3-month contributions across your direct, indirect, and extended invite chain.<br/>
                      Interest: <strong>{currentMember.memberType==="partner"?"1% per month (Partner Rate)":currentMember.memberType==="founding"?"2% per month (Founding Rate)":currentMember.memberType==="premium"?"3% per month (Premium Rate)":"4% per month (Regular Rate)"}</strong> on outstanding balance.<br/>
                      Repayment: <strong>Automatic</strong> — deducted from incoming network credits.
                    </div>
                    <div className="field">
                      <label>Bill Type</label>
                      <select value={loanForm.billType} onChange={e=>setLoanForm({...loanForm,billType:e.target.value})}>
                        <option value="">Select bill type...</option>
                        {["House Rent","School Fees","Medical Bills","Utility Bills","Business Bills","Other"].map(b=><option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Loan Amount (₦)</label>
                      <input type="number" placeholder="Enter amount" value={loanForm.amount} onChange={e=>setLoanForm({...loanForm,amount:e.target.value})}/>
                    </div>
                    <div className="field">
                      <label>Purpose / Details</label>
                      <textarea rows={3} placeholder="Describe the bill you need to co-fund..." value={loanForm.purpose} onChange={e=>setLoanForm({...loanForm,purpose:e.target.value})} style={{resize:"vertical"}}/>
                    </div>
                    {loanErr&&<div style={{color:ERROR,fontSize:13,marginBottom:10}}>{loanErr}</div>}
                    <button className="btn btn-blue" style={{width:"100%"}} onClick={handleLoanRequest}>Submit Co-Fund Loan Request</button>
                  </>
                )}
              </div>
              {loans.length>0&&(
                <div className="table-wrap">
                  <div className="table-head" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
                    <span>Date</span><span>Bill Type</span><span>Amount</span><span>Repayable</span><span>Status</span>
                  </div>
                  {loans.map((l,i)=>(
                    <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
                      <div>{new Date(l.created_at).toLocaleDateString("en-NG")}</div>
                      <div style={{fontSize:12}}>{l.bill_type}</div>
                      <div style={{fontWeight:700}}>{fmtNGN(l.amount)}</div>
                      <div style={{fontSize:12,color:MUTED}}>{l.total_repayable?fmtNGN(l.total_repayable):"—"}</div>
                      <div><span className={`status-pill ${l.status==="approved"?"pill-active":l.status==="rejected"?"pill-inactive":"pill-pending"}`}>{l.status}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {portalTab==="renew" && currentMember.memberType!=="partner" && (
            <div className="card">
              <div style={{fontWeight:800,fontSize:15,color:getTier(currentMember.memberType).bg,marginBottom:12}}>
                {currentMember.memberType==="premium"?"Renew Your Yearly Contribution":currentMember.memberType==="founding"?"Renew Your Term Contribution (Every 4 Months)":"Renew Your Monthly Contribution"}
              </div>
              <div style={{fontSize:13,color:MUTED,lineHeight:1.8,marginBottom:16}}>
                Renewal fee: <strong style={{color:getTier(currentMember.memberType).bg}}>{currentMember.memberType==="premium"?"₦100,000 / year":currentMember.memberType==="founding"?"₦50,000 / term (every 4 months)":"₦10,000 / month"}</strong><br/>
                Renew before your current contribution time-out to keep your membership status active and all credit channels earning secured.<br/>
                <strong>Credits earned during inactive status periods are permanently lost and channelled to the Loan Fund Pool.</strong>
              </div>
              {currentMember.expiresAt&&(
                <div style={{background:getTier(currentMember?.memberType||"regular").light,borderRadius:8,padding:12,fontSize:13,color:DARK,marginBottom:16}}>
                  <div>{currentMember.memberType==="premium"?"Yearly contribution expires:":currentMember.memberType==="founding"?"Term contribution expires:":"Monthly contribution expires:"} <strong>{new Date(currentMember.expiresAt).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"})}</strong></div>
                  <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8}}>
                    <span>Time remaining:</span>
                    <span style={{fontWeight:900,fontSize:15,color:
                      countdown==="EXPIRED"?ERROR:
                      countdown.startsWith("0d")||countdown.startsWith("1d")||countdown.startsWith("2d")?
                      "#92400E":getTier(currentMember.memberType).bg}}>
                      ⏱ {countdown||"—"}
                    </span>
                  </div>
                </div>
              )}
              <div className="info-box">
                <div style={{fontWeight:700,color:NAVY,marginBottom:6}}>Renewal Payment Details</div>
                <div style={{fontSize:13,color:NAVY,lineHeight:1.8}}>
                  Amount: {currentMember.memberType==="premium"?"₦100,000 (Yearly Contribution)":currentMember.memberType==="founding"?"₦50,000 (Term Contribution)":"₦10,000 (Monthly Contribution)"} | Reference: {currentMember.linkCode} — RENEWAL<br/>
                  Royal Tech Partnership & Investment Limited<br/>
                  Zenith Bank — 1016621205<br/>
                  WhatsApp: +234 909 999 4816
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN */}
      {view==="admin" && !adminAuth && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
          <div style={{fontSize:18,fontWeight:700,color:NAVY}}>Admin access required</div>
          <button className="btn btn-blue" onClick={()=>{setAdminPwd("");setAdminPwdErr("");setModal({type:"admin_login"});}}>Log In</button>
          <button className="btn btn-sm btn-outline-blue" onClick={()=>setView("landing")}>Back</button>
        </div>
      )}

      {view==="admin" && adminAuth && (
        <div className="admin-wrap">
          <div className="admin-header">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontWeight:900,fontSize:22}}>CoFundBills Admin Dashboard</div>
                <div style={{fontSize:13,opacity:.7,marginTop:2}}>{COMPANY}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-outline btn-sm" onClick={()=>setView("landing")} style={{background:"rgba(255,255,255,0.15)"}}>🏠 Home</button>
                <button className="btn btn-outline btn-sm" onClick={()=>{setAdminAuth(false);setAdminPwd("");setView("landing");}}>🔒 Lock & Exit</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginTop:20}}>
              {[["Total Members",allArr.length],["Active",activeArr.length],["Pending",pendingArr.length],["Admin",allArr.filter(m=>m.memberType==="admin").length+"/2"],["Partners",allArr.filter(m=>m.memberType==="partner").length+"/10"],["Founding",allArr.filter(m=>m.memberType==="founding").length+"/25"],["Invited",allArr.filter(m=>m.refCode&&m.memberType!=="founding"&&m.memberType!=="partner"&&m.memberType!=="admin").length],["Loan Pool",fmtNGN(loanPool)],["Total Credits",fmtNGN(allArr.reduce((s,m)=>s+m.totalCredited,0))]].map(([l,v])=>(
                <div key={l} style={{background:"rgba(255,255,255,0.12)",borderRadius:10,padding:12}}>
                  <div style={{fontSize:18,fontWeight:900}}>{v}</div>
                  <div style={{fontSize:11,opacity:.7,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-tabs">
            {[["members","All Members"],["pending","Pending Activation"],["renewals","Pending Renewal"],["cashouts","Cashout Queue"],["loans","Loan Queue"],["investors","Partners & Investors"],["analytics","Analytics"]].map(([id,label])=>(
              <button key={id} className={`admin-tab${adminTab===id?" active":""}`}
                onClick={async()=>{
                  setAdminTab(id);
                  if(id==="cashouts"){setAllCashouts(await DB.getAllCashouts());}
                  if(id==="loans"){setAllLoans(await DB.getAllLoans());}
                  if(id==="loans"||id==="investors"){setLoanPool(await DB.getLoanPool());}
                  if(id==="analytics"){await loadAnalytics();}
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* All Members */}
          {adminTab==="members" && (
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 1fr 80px",gap:12}}>
                <span>Member</span><span>Type</span><span>Expendable</span><span>Reserve</span><span>Loan Bal</span><span>Status</span><span>Del</span>
              </div>
              {allArr.length===0?<div style={{padding:32,textAlign:"center",color:MUTED}}>No members yet.</div>:allArr.map(m=>(
                <div key={m.linkCode} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 1fr 80px",gap:12,alignItems:"center"}}>
                  <div><div style={{fontWeight:700}}>{m.fullName}</div><div style={{fontSize:11,color:MUTED}}>{m.email}</div><div style={{fontSize:11,color:BLUE}}>{m.linkCode}</div></div>
                  <div><span style={{fontSize:11,
                    background:getTier(m.memberType).light,
                    color:getTier(m.memberType).bg,padding:"2px 8px",borderRadius:10,fontWeight:700}}>{m.memberType==="admin"?(m.investorSlot===2?"Co-Admin":"President/Admin"):m.memberType==="partner"?"Partner/Investor":m.memberType==="founding"?"Founding Member":m.memberType==="premium"?"Invited (Premium)":"Invited (Regular)"}</span></div>
                  <div style={{fontWeight:700,color:NAVY,fontSize:13}}>{fmtNGN(m.expendable)}</div>
                  <div style={{fontWeight:700,color:NAVY,fontSize:13}}>{fmtNGN(m.reserve)}</div>
                  <div style={{fontWeight:700,color:m.loanBalance>0?ERROR:MUTED,fontSize:13}}>{fmtNGN(m.loanBalance)}</div>
                  <div>
                    <span className={`status-pill ${m.status==="active"?"pill-active":m.status==="inactive"?"pill-inactive":"pill-pending"}`}>{m.status}</span>
                    {m.status==="active"&&m.memberType==="regular"&&(
                      <button style={{display:"block",marginTop:4,fontSize:10,background:"#FEE2E2",color:ERROR,border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer"}} onClick={()=>handleDeactivate(m.linkCode)}>Deactivate</button>
                    )}
                  {m.status==="active"&&m.memberType==="partner"&&(
                      <button style={{display:"block",marginTop:4,fontSize:10,background:"#FEF3C7",color:"#92400E",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer"}} onClick={()=>handleDeactivate(m.linkCode)}>Contract Lapsed</button>
                    )}
                  </div>
                  <div><button onClick={()=>handleDelete(m.linkCode,m.fullName)} style={{background:"#FEE2E2",border:"none",borderRadius:6,color:ERROR,fontSize:11,fontWeight:700,padding:"6px 8px",cursor:"pointer"}}>🗑</button></div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Activation */}
          {adminTab==="pending" && (
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 160px",gap:12}}>
                <span>Member</span><span>Type</span><span>Occupation</span><span>State</span><span>Referred By</span><span>Action</span>
              </div>
              {pendingArr.length===0?<div style={{padding:32,textAlign:"center",color:MUTED}}>No pending activations.</div>:pendingArr.map(m=>(
                <div key={m.linkCode} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 160px",gap:12,alignItems:"center"}}>
                  <div><div style={{fontWeight:700}}>{m.fullName}</div><div style={{fontSize:11,color:MUTED}}>{m.email}</div><div style={{fontSize:11,color:MUTED}}>{m.phone}</div><div style={{fontSize:11,color:BLUE}}>{m.linkCode}</div></div>
                  <div><span style={{fontSize:11,background:m.memberType==="premium"?GOLD_LIGHT:BLUE_LIGHT,color:m.memberType==="premium"?GOLD:BLUE,padding:"2px 8px",borderRadius:10,fontWeight:700}}>{m.memberType==="premium"?"Premium":"Regular"}</span></div>
                  <div style={{fontSize:12}}>{m.occupation}</div>
                  <div style={{fontSize:12}}>{m.state}</div>
                  <div style={{fontSize:12,color:MUTED}}>{m.refCode||"Direct"}</div>
                  <div>
                    <button className="btn btn-blue btn-sm" style={{width:"100%",marginBottom:4}} onClick={()=>handleActivate(m.linkCode)}>✅ Activate Link</button>
                    <button style={{width:"100%",padding:"5px",fontSize:11,background:"#FEE2E2",color:ERROR,border:"none",borderRadius:6,cursor:"pointer"}} onClick={()=>handleDelete(m.linkCode,m.fullName)}>🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Renewal */}
          {adminTab==="renewals" && (
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 160px",gap:12}}>
                <span>Member</span><span>Expires</span><span>Status</span><span>Action</span>
              </div>
              {allArr.filter(m=>m.memberType==="regular"&&(m.status==="inactive"||m.status==="pending")).length===0?
                <div style={{padding:32,textAlign:"center",color:MUTED}}>No pending renewals.</div>:
                allArr.filter(m=>m.memberType==="regular"&&(m.status==="inactive"||m.status==="pending")).map(m=>(
                <div key={m.linkCode} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 160px",gap:12,alignItems:"center"}}>
                  <div><div style={{fontWeight:700}}>{m.fullName}</div><div style={{fontSize:11,color:BLUE}}>{m.linkCode}</div></div>
                  <div style={{fontSize:12}}>{m.expiresAt?new Date(m.expiresAt).toLocaleDateString("en-NG"):"—"}</div>
                  <div><span className={`status-pill ${m.status==="inactive"?"pill-inactive":"pill-pending"}`}>{m.status}</span></div>
                  <div>
                    <button className="btn btn-blue btn-sm" style={{width:"100%"}} onClick={()=>handleRenew(m.linkCode)}>✅ Confirm Renewal</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cashout Queue */}
          {adminTab==="cashouts" && (
            <div className="table-wrap">
              <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 160px",gap:12}}>
                <span>Member</span><span>Type</span><span>Purpose</span><span>Amount</span><span>Status</span><span>Action</span>
              </div>
              {allCashouts.length===0?<div style={{padding:32,textAlign:"center",color:MUTED}}>No cashout requests.</div>:allCashouts.map((c,i)=>(
                <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 160px",gap:12,alignItems:"center"}}>
                  <div><div style={{fontWeight:700}}>{c.full_name}</div><div style={{fontSize:11,color:MUTED}}>{c.link_code}</div></div>
                  <div style={{textTransform:"capitalize",fontSize:12,fontWeight:600,color:c.type==="reserve"?NAVY:BLUE}}>{c.type}</div>
                  <div style={{fontSize:11,color:MUTED}}>{c.purpose||"—"}</div>
                  <div style={{fontWeight:700,color:NAVY}}>{fmtNGN(c.amount)}</div>
                  <div><span className={`status-pill ${c.status==="approved"?"pill-active":c.status==="rejected"?"pill-inactive":"pill-pending"}`}>{c.status}</span></div>
                  <div>
                    {c.status==="pending"&&(<>
                      <button className="btn btn-blue btn-sm" style={{width:"100%",marginBottom:4}} onClick={()=>handleApproveCashout(c)}>✅ Approve</button>
                      <button style={{width:"100%",padding:"5px",fontSize:11,background:"#FEE2E2",color:ERROR,border:"none",borderRadius:6,cursor:"pointer"}} onClick={()=>handleRejectCashout(c)}>✗ Reject</button>
                    </>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loan Queue */}
          {adminTab==="loans" && (
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontWeight:800,color:NAVY}}>Loan Fund Pool Balance</div>
                  <div style={{fontSize:24,fontWeight:900,color:GREEN}}>{fmtNGN(loanPool)}</div>
                </div>
              </div>
              <div className="table-wrap">
                <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 160px",gap:12}}>
                  <span>Member</span><span>Bill Type</span><span>Amount</span><span>Network</span><span>Status</span><span>Action</span>
                </div>
                {allLoans.length===0?<div style={{padding:32,textAlign:"center",color:MUTED}}>No loan requests.</div>:allLoans.map((l,i)=>(
                  <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr 160px",gap:12,alignItems:"center"}}>
                    <div><div style={{fontWeight:700}}>{l.full_name}</div><div style={{fontSize:11,color:MUTED}}>{l.link_code}</div><div style={{fontSize:11,color:MUTED}}>{l.purpose}</div></div>
                    <div style={{fontSize:12}}>{l.bill_type}</div>
                    <div><div style={{fontWeight:700,color:NAVY}}>{fmtNGN(l.amount)}</div><div style={{fontSize:11,color:MUTED}}>Limit: {fmtNGN(l.loan_limit)}</div></div>
                    <div style={{fontSize:11,color:MUTED}}>D:{l.network_direct} I:{l.network_indirect} E:{l.network_extended}</div>
                    <div><span className={`status-pill ${l.status==="approved"?"pill-active":l.status==="rejected"?"pill-inactive":"pill-pending"}`}>{l.status}</span></div>
                    <div>
                      {l.status==="pending"&&(<>
                        <button className="btn btn-green btn-sm" style={{width:"100%",marginBottom:4}} onClick={()=>handleApproveLoan(l)}>✅ Approve Loan</button>
                        <button style={{width:"100%",padding:"5px",fontSize:11,background:"#FEE2E2",color:ERROR,border:"none",borderRadius:6,cursor:"pointer"}} onClick={()=>handleRejectLoan(l)}>✗ Reject</button>
                      </>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investors */}
          {adminTab==="investors" && (
            <div>
              <div className="card" style={{marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:15,color:NAVY,marginBottom:8}}>Founding / Investor Members</div>
                <div style={{fontSize:13,color:MUTED,lineHeight:1.8}}>
                  Founding members hold perpetually active Co-Fund links with no monthly contribution. They share monthly loan interest proceeds equally across all investor slots. Each slot represents 1/{PARTNER_SLOTS}th of total monthly interest collected.
                </div>
              </div>
              <div className="table-wrap">
                <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr",gap:12}}>
                  <span>Name</span><span>Link Code</span><span>Expendable</span><span>Reserve</span><span>Total Credited</span>
                </div>
                {allArr.filter(m=>m.memberType==="partner"||m.memberType==="admin").length===0?
                  <div style={{padding:32,textAlign:"center",color:MUTED}}>No partners or admin yet.</div>:
                  allArr.filter(m=>m.memberType==="partner"||m.memberType==="admin").map(m=>(
                  <div key={m.linkCode} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr",gap:12}}>
                    <div><div style={{fontWeight:700}}>{m.fullName}</div><div style={{fontSize:11,color:MUTED}}>{m.email}</div></div>
                    <div style={{fontSize:12,color:BLUE,fontWeight:600}}>{m.linkCode}</div>
                    <div style={{fontWeight:700,color:NAVY}}>{fmtNGN(m.expendable)}</div>
                    <div style={{fontWeight:700,color:NAVY}}>{fmtNGN(m.reserve)}</div>
                    <div style={{fontWeight:700}}>{fmtNGN(m.totalCredited)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab==="analytics" && (
            <div>
              {analyticsLoading ? (
                <div style={{padding:40,textAlign:"center",color:MUTED}}>Loading analytics...</div>
              ) : (
                <>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
                    {[
                      ["Total Visits",analytics.length],
                      ["Today",analytics.filter(v=>new Date(v.visited_at).toDateString()===new Date().toDateString()).length],
                      ["Via Invite Link",analytics.filter(v=>v.ref_code).length],
                      ["Landing Page",analytics.filter(v=>v.page==="landing").length],
                      ["Registrations",analytics.filter(v=>v.page==="register").length],
                      ["Portal Visits",analytics.filter(v=>v.page==="portal").length],
                      ["Mobile",analytics.filter(v=>v.screen&&Number(v.screen.split("x")[0])<768).length],
                      ["Desktop",analytics.filter(v=>v.screen&&Number(v.screen.split("x")[0])>=768).length],
                    ].map(([l,v])=>(
                      <div key={l} style={{background:WHITE,borderRadius:10,padding:14,
                        boxShadow:"0 2px 8px rgba(13,33,55,0.06)",border:"1px solid #D0DAED",textAlign:"center"}}>
                        <div style={{fontSize:24,fontWeight:900,color:NAVY}}>{v}</div>
                        <div style={{fontSize:11,color:MUTED,marginTop:2,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {analytics.filter(v=>v.ref_code).length>0&&(
                    <div className="card" style={{marginBottom:16}}>
                      <div style={{fontWeight:800,color:NAVY,fontSize:14,marginBottom:12}}>Top Invite Links Driving Traffic</div>
                      {Object.entries(analytics.filter(v=>v.ref_code).reduce((acc,v)=>{acc[v.ref_code]=(acc[v.ref_code]||0)+1;return acc;},{}))
                        .sort((a,b)=>b[1]-a[1]).slice(0,10).map(([ref,count])=>(
                        <div key={ref} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                          padding:"8px 0",borderBottom:"1px solid #EBF0F8",fontSize:13}}>
                          <div>
                            <span style={{fontWeight:700,color:BLUE}}>{ref}</span>
                            <span style={{fontSize:11,color:MUTED,marginLeft:8}}>{members[ref]?.fullName||"Unknown"}</span>
                          </div>
                          <div style={{background:BLUE_LIGHT,borderRadius:12,padding:"2px 10px",fontSize:12,fontWeight:700,color:NAVY}}>{count} visits</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="card" style={{marginBottom:16}}>
                    <div style={{fontWeight:800,color:NAVY,fontSize:14,marginBottom:12}}>Pages Visited</div>
                    {[["landing","Home / Landing"],["register","Registration"],["portal","Member Portal"],["admin","Admin Dashboard"]].map(([page,label])=>{
                      const cnt=analytics.filter(v=>v.page===page).length;
                      const pct=analytics.length>0?Math.round(cnt/analytics.length*100):0;
                      return(
                        <div key={page} style={{marginBottom:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                            <span style={{fontWeight:600,color:NAVY}}>{label}</span>
                            <span style={{color:MUTED}}>{cnt} visits ({pct}%)</span>
                          </div>
                          <div style={{background:BLUE_LIGHT,borderRadius:6,height:8,overflow:"hidden"}}>
                            <div style={{background:BLUE,height:"100%",width:pct+"%",borderRadius:6}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="table-wrap">
                    <div className="table-head" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr",gap:12}}>
                      <span>Date & Time</span><span>Page</span><span>Via Link</span><span>Device</span><span>Language</span>
                    </div>
                    {analytics.length===0?(
                      <div style={{padding:32,textAlign:"center",color:MUTED}}>No visitor data yet.</div>
                    ):analytics.slice(0,100).map((v,i)=>(
                      <div key={i} className="table-row" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr",gap:12,fontSize:12}}>
                        <div style={{color:MUTED}}>{new Date(v.visited_at).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                        <div><span style={{background:BLUE_LIGHT,color:BLUE,padding:"2px 8px",borderRadius:8,fontWeight:600,textTransform:"capitalize",fontSize:11}}>{v.page}</span></div>
                        <div style={{color:BLUE,fontWeight:600}}>{v.ref_code||"—"}</div>
                        <div style={{color:MUTED}}>{v.screen&&Number(v.screen.split("x")[0])<768?"Mobile":"Desktop"}</div>
                        <div style={{color:MUTED}}>{v.language||"—"}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {modal?.type==="admin_login" && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:380}} onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Admin Access</div>
            <div className="modal-sub">CoFundBills Admin Dashboard</div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="Enter admin password" value={adminPwd}
                onChange={e=>{setAdminPwd(e.target.value);setAdminPwdErr("");}}
                onKeyDown={e=>{if(e.key==="Enter"){if(adminPwd===ADMIN_PASSWORD){setAdminAuth(true);setModal(null);setView("admin");setAdminTab("members");}else setAdminPwdErr("Incorrect password.");}}}/>
              {adminPwdErr&&<div className="err-msg">{adminPwdErr}</div>}
            </div>
            <button className="btn btn-blue" style={{width:"100%",marginBottom:8}}
              onClick={()=>{if(adminPwd===ADMIN_PASSWORD){setAdminAuth(true);setModal(null);setView("admin");setAdminTab("members");}else setAdminPwdErr("Incorrect password.");}}>Log In</button>
            <button className="btn btn-sm btn-outline-blue" style={{width:"100%"}} onClick={()=>setModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {modal?.type==="login" && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setModal(null)}>
          <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Log In to Your Portal</div>
            <div className="modal-sub">Enter your Co-Fund Link Code to access your account.</div>
            <div className="field">
              <label>Co-Fund Link Code</label>
              <input type="text" placeholder="e.g. CFB-EIG-AB12" value={loginCode}
                onChange={e=>{setLoginCode(e.target.value.toUpperCase());setLoginErr("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
              {loginErr&&<div className="err-msg">{loginErr}</div>}
            </div>
            <button className="btn btn-blue" style={{width:"100%",marginBottom:8}} onClick={handleLogin}>Log In</button>
            <button className="btn btn-sm btn-outline-blue" style={{width:"100%"}} onClick={()=>setModal(null)}>Cancel</button>
            <div style={{fontSize:12,color:MUTED,marginTop:12,textAlign:"center"}}>
              Not yet a member?{" "}<button style={{background:"none",border:"none",color:BLUE,cursor:"pointer",fontWeight:600,fontSize:12}} onClick={()=>{setModal(null);setTcAccepted(false);setShowTC(true);}}>Join Free</button>
            </div>
          </div>
        </div>
      )}

      {modal?.type==="reg_success" && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div className="modal" style={{maxWidth:460,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <div className="modal-title" style={{textAlign:"center"}}>Welcome to CoFundBills!</div>
            <div style={{fontSize:14,color:MUTED,margin:"12px 0 20px",lineHeight:1.7}}>Registration successful, <strong>{modal.name}</strong>!<br/>Your Co-Fund Invite Link Code is:</div>
            <div style={{background:BLUE_LIGHT,border:`2px solid ${BLUE}`,borderRadius:10,padding:16,fontSize:18,fontWeight:900,color:NAVY,marginBottom:20,letterSpacing:2}}>{modal.linkCode}</div>
            <div className="info-box" style={{textAlign:"left"}}>
              <div style={{fontWeight:700,color:NAVY,marginBottom:8}}>Next Step — Activate Your Co-Fund Invite Link:</div>
              <div style={{fontSize:13,color:NAVY,lineHeight:1.8,marginBottom:12}}>
                Pay <strong>₦10,000</strong> first monthly contribution to activate your membership status.
              </div>
              <div style={{background:WHITE,border:`1.5px solid ${GOLD}`,borderRadius:8,
                padding:12,fontSize:13,color:NAVY,lineHeight:1.9}}>
                <strong>Royal Tech Partnership & Investment Limited</strong><br/>
                Zenith Bank — 1016621205<br/>
                Reference: <strong>{modal.linkCode}</strong><br/>
                Then WhatsApp: <strong>+234 909 999 4816</strong>
              </div>
            </div>
            <button className="btn btn-blue" style={{width:"100%"}} onClick={()=>{setModal(null);setView("landing");}}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}
