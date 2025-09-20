import { MongoClient } from "mongodb";

const uri = process.env.DB_URI!;
const client = new MongoClient(uri);
async function run() {
	try {
		const database = client.db('sample_mflix');
		const movies = database.collection('movies');
		// Queries for a movie that has a title value of 'Back to the Future'
		const query = { title: 'Back to the Future' };
		const movie = await movies.findOne(query);
		//@ts-ignore
		console.log(movie.name);
	} finally {
		await client.close();
	}
}
run().catch(console.dir);

export default function() {
	run().catch(console.dir);
	return <h1>hello </h1>
}
