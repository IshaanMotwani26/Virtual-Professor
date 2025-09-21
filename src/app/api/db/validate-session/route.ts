import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.DB_URI!;

export async function GET(req: Request) {
	const client = new MongoClient(uri);
	const backendDB = client.db("Virtual-Prof");
	const users = backendDB.collection("Sessions");

	// Read session token from query string: /api/db/validate-session?session=...
	try {
		const url = new URL(req.url);
		const session = url.searchParams.get('session');
		if (!session) {
			return NextResponse.json({ error: 'Missing session' }, { status: 400 });
		}
		const user = await users.findOne({ session });
		if (!user) {
			return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
		}
		return NextResponse.json({ username: user.username }, { status: 200 });
	} catch (err) {
		console.error('validate-session error', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
