import express from 'express';
import { Client, middleware, MiddlewareConfig, WebhookEvent } from '@line/bot-sdk';
import { GoogleSpreadsheet } from 'google-spreadsheet';

// LINE Bot configuration
const config = {
    channelAccessToken: process.env.LINE_BOT_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_BOT_CHANNEL_SECRET,
};

const client = new Client(config);

// Google Spreadsheet configuration
const doc = new GoogleSpreadsheet('YOUR_SPREADSHEET_ID');
await doc.useServiceAccountAuth(require('./path/to/credentials.json'));
await doc.loadInfo();
const sheet = doc.sheetsByIndex[0]; // Use the first sheet

const app = express();

app.post('/webhook', middleware(config), async (req, res) => {
    const events: WebhookEvent[] = req.body.events;
    const results = await Promise.all(events.map(handleEvent));
    res.json(results);
});

const handleEvent = async (event: WebhookEvent) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userId = event.source.userId;
    const userMessage = event.message.text;

    // Handle different commands
    if (userMessage.startsWith('記録したい')) {
        await addMemo(userId, userMessage.replace('記録したい', '').trim());
        return client.replyMessage(event.replyToken, { type: 'text', text: '記録しました' });
    }

    if (userMessage.startsWith('削除したい')) {
        await deleteMemo(userId, userMessage.replace('削除したい', '').trim());
        return client.replyMessage(event.replyToken, { type: 'text', text: '削除しました' });
    }

    if (userMessage.startsWith('リスト')) {
        const list = await getMemoList(userId);
        return client.replyMessage(event.replyToken, { type: 'text', text: `リスト:\n${list}` });
    }

    return client.replyMessage(event.replyToken, { type: 'text', text: 'コマンドが認識されませんでした' });
};

const addMemo = async (userId: string, memo: string) => {
    await sheet.addRow({ UserId: userId, Memo: memo, Timestamp: new Date().toISOString() });
};

const deleteMemo = async (userId: string, memo: string) => {
    const rows = await sheet.getRows();
    const row = rows.find(row => row.UserId === userId && row.Memo === memo);
    if (row) {
        await row.delete();
    }
};

const getMemoList = async (userId: string) => {
    const rows = await sheet.getRows();
    return rows.filter(row => row.UserId === userId).map(row => row.Memo).join('\n');
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
