import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

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
	const userData: User = (await req.json()).userData;
	if (await users.findOne({ username: userData.username })) {
		console.log("Duplicate user signup detected");
		NextResponse.json({ error: "User already signed up" }, { status: 409 });
	} else {
		bcrypt.hash(userData.password, SALT_ROUNDS, function(err, hash) {
			if (err) {
				console.error(err);
				NextResponse.json({ error: "Error hashing password, please report this error to Virtual Prof." }, { status: 400 });
			}
			users.insertOne({
				username: userData.username,
				email: userData.email,
				name: userData.name,
				hash: hash
			});
		});
	}
	client.close();
}

