import { getReferrer } from "../../lib/waitlist";

export default function handler(req, res) {
  const { user } = req.query;
  console.debug(`[api/eligibility] user=${user}`);
  if (!user) {
    return res.status(400).json({ error: "Missing user" });
  }
  const referrer = getReferrer(user);
  const whitelisted = !!referrer;
  console.debug(
    `[api/eligibility] whitelisted=${whitelisted} referrer=${referrer}`
  );
  const needsVoucherEachBuy =
    process.env.NEEDS_VOUCHER_EACH_BUY === "true";
  return res.status(200).json({
    whitelisted,
    referrer: referrer || null,
    limits: null,
    phase: null,
    needsVoucherEachBuy,
  });
}
