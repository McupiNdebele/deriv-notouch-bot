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

ws.on("message", (msg) => {
  const data = JSON.parse(msg);

  if (data.msg_type === "authorize") {
    console.log("Authorized");
    requestProposal();
  }

  if (data.msg_type === "proposal") {
    buyContract(data.proposal.id);
  }

  if (data.msg_type === "buy") {
    console.log("Trade placed:", data.buy.contract_id);
  }

  if (data.msg_type === "proposal_open_contract") {
    if (data.proposal_open_contract.is_sold) {
      console.log("Trade result:", data.proposal_open_contract.profit);
      ws.close(); // stop after one trade (aggressive control)
    }
  }
});

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
