// Sent once a day by .github/workflows/evening-reminder.yml. Blasts the
// "log today's expenses" reminder to every registered device and prunes
// tokens that Firebase reports as dead (uninstalled app, revoked permission).
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

const db = admin.firestore();

async function main() {
  const snap = await db.collection('pushTokens').get();
  if (snap.empty) {
    console.log('No registered devices, nothing to send.');
    return;
  }

  const tokens = snap.docs.map((d) => d.id);
  const message = {
    notification: {
      title: 'Финансы',
      body: 'Не забудьте внести расходы за сегодня',
    },
    tokens,
  };

  const res = await admin.messaging().sendEachForMulticast(message);
  console.log(`Sent: ${res.successCount}, failed: ${res.failureCount}`);

  const deletions = [];
  res.responses.forEach((r, i) => {
    if (!r.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(r.error?.code)) {
      deletions.push(db.collection('pushTokens').doc(tokens[i]).delete());
    }
  });
  if (deletions.length) {
    await Promise.all(deletions);
    console.log(`Pruned ${deletions.length} dead token(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
