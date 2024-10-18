const fs = require('fs')
const readline = require('readline')
const path = require('path')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

const outputDir = './readmes' // Define the output directory

rl.question('Enter the version of the documentation (leave blank for latest): ', (input) => {
	const version = input.trim() || 'latest' // Default to 'latest' if no input
	const templatePath = './README-Template.md' // Path to your original markdown file
	const dockerComposePath = `./${version}/dockerized/MentorEd-Setup-README.md`
	const pm2Path = `./${version}/native/MentorEd-Setup-README.md`

	// Ensure the output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir)
	}

	fs.readFile(templatePath, 'utf8', (err, data) => {
		if (err) {
			console.error(`Failed to read the template markdown file: ${err.message}`)
			rl.close()
			return
		}

		// Replace all instances of {{MENTORED_VERSION}} with the specified version
		let updatedMarkdown = data.replace(/{{MENTORED_VERSION}}/g, version)

		fs.readFile(dockerComposePath, 'utf8', (err, dockerContent) => {
			if (err) {
				console.error(`Failed to read Docker Compose documentation: ${err.message}`)
				rl.close()
				return
			}

			updatedMarkdown = updatedMarkdown.replace('{{DOCKER_COMPOSE_DOCUMENTATION}}', dockerContent)

			fs.readFile(pm2Path, 'utf8', (err, pm2Content) => {
				if (err) {
					console.error(`Failed to read PM2 documentation: ${err.message}`)
					rl.close()
					return
				}

				updatedMarkdown = updatedMarkdown.replace('{{PM2_DOCUMENTATION}}', pm2Content)

				const outputFilename = version === 'latest' ? 'README.md' : `README-${version}.md`
				const fullPath = path.join(outputDir, outputFilename) // Construct full path for the output file

				fs.writeFile(fullPath, updatedMarkdown, 'utf8', (err) => {
					if (err) {
						console.error(`Failed to write the updated README file: ${err.message}`)
					} else {
						console.log(`Updated README successfully written to ${fullPath}`)
					}
					rl.close()
				})
			})
		})
	})
})
