import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const uri = process.env.DB_URI!;

const client = new MongoClient(uri);
const backendDB = client.db("Virtual-Prof");
const users = backendDB.collection("Users");

type User = {
	name: string,
	username: string,
	password: string,
	email: string
}
// TODO: Actually create a session for the user and return that
export async function POST(data: User): Promise<string | undefined> {
	const user = await users.findOne({ username: data.username });
	if (!user) {
		return `No user found with username ${data.username}`;
	}
	bcrypt.compare(data.password, user.hash, function(err, matches) {
		if (err) {
			console.error(err);
			return;
		}
		if (matches) {
			return "Logged in";
		} else {
			return "Password did not match"
		}
	});
}

