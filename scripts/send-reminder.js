// Sent once a day by .github/workflows/evening-reminder.yml. Blasts the
// "log today's expenses" reminder to every registered device and prunes
// tokens that Firebase reports as dead (uninstalled app, revoked permission).
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

const db = admin.firestore();

// Rotates by day-of-year so the phrasing changes daily but stays stable if
// the workflow is re-run the same day (e.g. manual testing).
const MESSAGES = [
  'Не забудьте внести расходы за сегодня',
  'Эй, а куда сегодня утекли деньги? Занесите в приложение',
  'Пять минут — и бюджет снова в порядке. Внесите траты за день',
  'Ваши расходы соскучились по приложению. Внесите их за сегодня',
  'Маленькое дело на вечер: записать, куда ушли деньги',
  'Кошелёк помнит всё, а вы? Внесите сегодняшние траты',
  'Ежедневный ритуал: чай, покой и внесённые расходы',
  'Сегодняшние траты сами себя не запишут',
  'Финансовая гигиена: не забудьте внести расходы за день',
  'Пара кликов — и бюджет под контролем. Внесите траты за сегодня',
  'Деньги любят счёт, а счёт любит вас — внесите расходы',
  'Пока не забыли: что купили сегодня?',
  'Вечерний чек-ин: внесите расходы за сегодня',
  'Бюджет заскучал без сегодняшних трат — самое время их внести',
];

function pickMessage() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MESSAGES[dayOfYear % MESSAGES.length];
}

async function main() {
  const snap = await db.collection('pushTokens').get();
  if (snap.empty) {
    console.log('No registered devices, nothing to send.');
    return;
  }

  const tokens = snap.docs.map((d) => d.id);
  const message = {
    notification: {
      // iOS Safari appears to require a non-empty title to display the
      // push at all. Keep it distinct from the PWA's own name ("Мои
      // финансы") so it doesn't repeat as "Мои финансы from Мои финансы".
      title: 'Напоминание',
      body: pickMessage(),
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
