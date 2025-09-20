import { MongoClient } from "mongodb";

const uri = process.env.DB_URI!;

async function run_test() {
	const client = new MongoClient(uri);
	try {
		const database = client.db('sample_mflix');
		const movies = database.collection('movies');
		// Queries for a movie that has a title value of 'Back to the Future'
		const query = { title: 'Back to the Future' };
		const movie = await movies.findOne(query);
		console.log(movie);
	} finally {
		await client.close();
	}
}

async function add_user(username: string, password: string, email: string) {
	const client = new MongoClient(uri);
	const backendDB = client.db("Virtual-Prof");
	const users = backendDB.collection("users");
	users.createIndex(username)
}

export default function DB() {
	return (
		<main className="p-8">
			<h1 className="text-3xl font-bold mb-2">DB Page</h1>
			<p className="text-gray-700">
				Placeholder for database views. Not used for the API key test. Go to{" "}
				<a className="underline" href="/vinay">/vinay</a>.
			</p>
		</main>
	);
