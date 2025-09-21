import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

const uri = process.env.DB_URI!;

type User = {
	name: string,
	username: string,
	password: string,
	email: string
}

// TODO: Actually create a session for the user and return that
export async function POST(req: Request) {
	const client = new MongoClient(uri);
	const backendDB = client.db("Virtual-Prof");
	const users = backendDB.collection("Users");

	const data: User = await req.json();
	const user = await users.findOne({ email: data.email });
	if (!user) {
		return NextResponse.json({ error: "Password or username is invalid" }, { status: 400 });
	}
	const matches = await bcrypt.compare(data.password, user.hash)
	if (matches) {
		return NextResponse.json({ "Set-Cookie": `session=${createSession(data.username)}` }, { status: 200 });
	} else {
		return NextResponse.json({ error: "Password or username is invalid" }, { status: 400 });
	}
}

export async function createSession(username: string): Promise<string> {
	const client = new MongoClient(uri);
	const backendDB = client.db("Virtual-Prof");
	const sessions = backendDB.collection("Sessions");

	await sessions.deleteMany({ username });

	const session = crypto.randomUUID();

	const expiry = new Date(Date.now() + (1000 * 3600 * 24 * 7));

	sessions.insertOne({
		session,
		username,
		expiry
	});

	return session;
}
