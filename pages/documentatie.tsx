 import Head from "next/head";

export default function DocumentatieRedirect() {
	return (
		<>
			<Head>
				<title>Nuts - Kennisbank</title>
				<meta httpEquiv="refresh" content="0;url=/kennisbank/" />
				<link rel="canonical" href="https://nuts.nl/kennisbank/" />
			</Head>
			<main className="container mx-auto py-12">
				<p>
					De documentatie is verplaatst naar de kennisbank.{" "}
					<a className="underline" href="/kennisbank/">Ga naar de kennisbank</a>.
				</p>
			</main>
		</>
	);
}
