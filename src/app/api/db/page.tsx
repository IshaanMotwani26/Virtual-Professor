import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const uri = process.env.DB_URI!;
const SALT_ROUNDS = 10;

const client = new MongoClient(uri);
const backendDB = client.db("Virtual-Prof");
const users = backendDB.collection("Users");

async function run_test() {
	try {
		const database = client.db('sample_mflix');
		const movies = database.collection('movies');
		// Queries for a movie that has a title value of 'Back to the Future'
		const query = { title: 'Back to the Future' };
		const movie = await movies.findOne(query);
		console.log(movie);
	} finally { }
}

type User = {
	name: string,
	username: string,
	password: string,
	email: string
}

export async function add_user(data: User): Promise<string | undefined> {
	if (await users.findOne({ username: data.username })) {
		console.log("Duplicate user signup detected");
		return "User already signed up";
	}
	bcrypt.hash(data.password, SALT_ROUNDS, function(err, hash) {
		if (err) {
			console.error(err);
			return "Error hashing password, please report";
		}
		users.insertOne({
			username: data.username,
			email: data.email,
			name: data.name,
			hash: hash
		});
	});
}

// TODO: Actually create a session for the user and return that
export async function login(data: User): Promise<string | undefined> {
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

export default function() {
	add_user("VINAY", "hunter2", "havethebestgoats@gmail.com")
	return (
		<main className="p-8">
			<h1 className="text-3xl font-bold mb-2">DB Page</h1>
			<p className="text-gray-700">
				Placeholder for database views. Not used for the API key test. Go to{" "}
				<a className="underline" href="/vinay">/vinay</a>.
			</p>
		</main>
	);
}
