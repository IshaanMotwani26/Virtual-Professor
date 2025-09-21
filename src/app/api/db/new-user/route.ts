import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { createSession } from "../signin/route";

const uri = process.env.DB_URI!;
const SALT_ROUNDS = 10;


type User = {
	name: string,
	username: string,
	password: string,
	email: string
}

export async function POST(req: Request) {
	const client = new MongoClient(uri);
	const backendDB = client.db("Virtual-Prof");
	const users = backendDB.collection("Users");
	const userData: User = await req.json();
	if (await users.findOne({ username: userData.username })) {
		console.log("Duplicate user signup detected");
		return NextResponse.json({ error: "User already signed up" }, { status: 409 });
	} else {
		const hash = await bcrypt.hash(userData.password, SALT_ROUNDS);
		users.insertOne({
			username: userData.username,
			email: userData.email,
			name: userData.name,
			hash: hash
		});
		return NextResponse.json({ "Set-Cookie": `session=${createSession(userData.username)}` }, { status: 200 });
	}
}

