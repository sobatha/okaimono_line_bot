import { JWT } from 'google-auth-library';

const client = new JWT({
	email: process.env.GOOGLE_SERVICEACCOUNT_EMAIL,
	key: process.env.GOOGLE_SERVICEACCOUNT_KEY,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
