import WebSocket from "ws";

const APP_ID = process.env.APP_ID;
const TOKEN = process.env.DERIV_TOKEN;

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

const SYMBOL = "R_100"; // Volatility index (change later if needed)
const STAKE = 10;
const DURATION = 4;
const DURATION_UNIT = "h";
const TARGET_PAYOUT = 1.10; // 10% payout

ws.on("open", () => {
  ws.send(JSON.stringify({ authorize: TOKEN }));
});
///////
ws.on("message", (msg) => {
  const data = JSON.parse(msg);

  // 1) If Deriv sends an error, log it and stop this cycle
  if (data.error) {
    console.log("Deriv error:", data.error.message);
    return;
  }

  // 2) After authorize, request a proposal
  if (data.msg_type === "authorize") {
    console.log("Authorized");

    ws.send(JSON.stringify({
      proposal: 1,
      amount: STAKE,
      basis: "stake",
      contract_type: "NO_TOUCH",
      currency: "USD",
      symbol: SYMBOL,
      duration: DURATION,
      duration_unit: DURATION_UNIT,

      // IMPORTANT:
      // You MUST set a barrier for NO_TOUCH.
      // Put your chosen barrier here:
      barrier: "PUT_BARRIER_HERE"
    }));

    return;
  }

  // 3) Only buy when we actually received a proposal
  if (data.msg_type === "proposal") {
    if (!data.proposal || !data.proposal.id) {
      console.log("No proposal id in response:", data);
      return;
    }

    console.log("Got proposal:", data.proposal.id);
    buyContract(data.proposal.id);
    return;
  }

  // (Optional) log other messages for debugging
  // console.log("Other msg:", data.msg_type);
});

///////
function requestProposal() {
  ws.send(JSON.stringify({
    proposal: 1,
    amount: STAKE,
    basis: "stake",
    contract_type: "NO_TOUCH",
    currency: "USD",
    symbol: SYMBOL,
    duration: DURATION,
    duration_unit: DURATION_UNIT,
    barrier: "+0.5", // Railway will adjust later dynamically
  }));
}

function buyContract(id) {
  ws.send(JSON.stringify({
    buy: id,
    price: STAKE
  }));
}
