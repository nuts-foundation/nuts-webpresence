import fs from "fs/promises"

import jsonfeedToRSS from "jsonfeed-to-rss"

import podcast from "./config/podcast.json" assert { type: "json" }

function parseDuration(dur) {
  const [hours, minutes, seconds] = dur.split(":").map(Number)
  return hours * 3600 + minutes * 60 + seconds
}

async function main() {
  const feed = {
    version: "https://jsonfeed.org/version/1",
    feed_url: "https://nuts.nl/going-nuts.xml",
    home_page_url: "https://nuts.nl",
    title: podcast.title,
    description: podcast.summary,
    _itunes: {
      subtitle: podcast.subtitle,
      author: podcast.author.name,
      summary: podcast.summary,
      // Add a random prefix so that the categories aren't valid iTunes categories
      category: podcast.category.map(c => `_${c}`),
      owner: {
        name: podcast.author.name,
        email: podcast.author.email,
      },
      image: podcast.image,
      keywords: podcast.keywords.join(", "),
      explicit: false
    },
    items: []
  }

  podcast.episodes.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  podcast.episodes.forEach(episode => {
    feed.items.push({
      id: episode.guid,
      title: episode.title,
      content_html: episode.summary,
      image: podcast.image,
      date_published: new Date(episode.publishedAt).toISOString(),
      _itunes: {
        author: podcast.author.name,
        subtitle: episode.subtitle,
        summary: episode.summary,
        image: podcast.image,
        explicit: false,
        episodeType: "full"
      },
      attachments: [{
        mime_type: "audio/mp3",
        url: `https://nuts.nl/${episode.file}`,
        size_in_bytes: episode.length,
        duration_in_seconds: parseDuration(episode.duration),
      }]
    })
  })

  await fs.writeFile("public/going-nuts.xml", jsonfeedToRSS(feed, {
    itunes: true,
    language: "nl",
    webMaster: podcast.author.email,
    copyright: "©2022, copyleft gepubliceerd onder CC BY-SA 2.0 licentie"
  })
    // Fix for multiple categories that aren't supported
    .replace(/<category>_/g, '<itunes:category text="')
    .replace(/<\/category>/g, '"></itunes:category>'))
}

console.log("generating...")

main()
  .then(() => console.log("done!"))
  .catch(function (e) {
    console.error(e)
  })
