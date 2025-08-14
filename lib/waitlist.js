import fs from "fs";
import path from "path";

const waitlist = new Map();

function loadWaitlist() {
  const file = process.env.WAITLIST_CSV || path.join(process.cwd(), "data", "waitlist.csv");
  try {
    const content = fs.readFileSync(file, "utf8");
    content.split(/\r?\n/).forEach((line) => {
      const [user, referrer] = line.split(",").map((v) => v && v.trim().toLowerCase());
      if (user && referrer && user !== "user") {
        waitlist.set(user, referrer);
      }
    });
  } catch (err) {
    console.warn("Waitlist CSV not loaded:", err.message);
  }
}

loadWaitlist();

export function getReferrer(address) {
  if (!address) return null;
  return waitlist.get(address.toLowerCase()) || null;
}

export function isWhitelisted(address) {
  return getReferrer(address) !== null;
}

export function getWaitlist() {
  return waitlist;
}
