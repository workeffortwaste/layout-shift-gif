#!/usr/bin/env node

/*
 * SPDX-License-Identifier: Apache-2.0
 */

/* Args */
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

/* Puppeteer */
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

/* Misc */
import fs from 'fs'
import tmp from 'tmp'

/* Image generation */
import GIFEncoder from 'gif-encoder-2'
import pkg from 'canvas'
const { createCanvas, loadImage } = pkg

/* Evade bot detection */
puppeteer.use(StealthPlugin())

/* Colors */
const colors = {
  reset: '\x1b[0m',
  underscore: '\x1b[4m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
}

/* About */
const { version } = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)))
console.log(`layout-shift-gif ${version} /  ${colors.blue}@defaced.dev (bluesky)${colors.reset}`)

/* Support */
if (!process.env.WORKEFFORTWASTE_SUPPORTER) {
  console.log(`${colors.magenta}
┃
┃ ${colors.underscore}Support this project! ${colors.reset}${colors.magenta}
┃
┃ Help support the work that goes into creating and maintaining my projects
┃ and consider donating via on GitHub Sponsors.
┃
┃ GitHub Sponsors: https://github.com/sponsors/workeffortwaste/
┃${colors.reset}
  `)
}

const options = yargs(hideBin(process.argv))
  .usage('Usage: layout-shift-gif --url <url>')
  .example('layout-shift-gif --url https://blacklivesmatter.com/ --device mobile --output layout-shift.gif')
  .default({ d: 'mobile', o: 'layout-shift.gif', t: 'new', r: false })
  .describe('u', 'Website URL')
  .describe('d', 'Device type')
  .describe('w', 'Device viewport width')
  .describe('h', 'Device viewport height')
  .describe('c', 'Cookie filename')
  .describe('o', 'Output filename')
  .describe('t', 'CLS calculation method')
  .describe('r', 'Save report of shifts and elements')
  .alias('u', 'url')
  .alias('d', 'device')
  .alias('w', 'width')
  .alias('h', 'height')
  .alias('c', 'cookies')
  .alias('o', 'output')
  .alias('r', 'report')
  .alias('t', 'type')
  .number(['h', 'w'])
  .string(['u', 'd', 'c', 'o', 't'])
  .boolean(['r'])
  .demandOption(['url'])
  .epilogue('For more information visit documentation at: \nhttp://github.com/workeffortwaste/layout-shift-gif')
  .argv

/* Network conditions */
const Good3G = {
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 40
}

/* Device for mobile emulation */
const phone = {
  name: 'Nexus 5X',
  userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR4.170623.006) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3765.0 Mobile Safari/537.36',
  viewport: {
    width: 412,
    height: 732,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    isLandscape: false
  }
}

/* Detect layout shift */
const clsDetection = (type) => {
  const getElementSelector = (element) => {
    if (!element) return null

    const parts = []

    while (element.parentElement) {
      let part = element.tagName.toLowerCase() // Tag name in lowercase

      // Add ID if present
      if (element.id) {
        part += `#${element.id}`
      }

      // Add classes if present
      if (element.className) {
        const classes = element.className.trim().split(/\s+/).join('.')
        part += `.${classes}`
      }

      // Add :nth-child if necessary
      const siblings = Array.from(element.parentElement.children)
      if (siblings.filter(el => el.tagName === element.tagName).length > 1) {
        const index = siblings.indexOf(element) + 1
        part += `:nth-child(${index})`
      }

      parts.unshift(part) // Add the part to the beginning of the array
      element = element.parentElement // Move up to the parent
    }

    // Include `body` or `html` as the root
    parts.unshift(element.tagName.toLowerCase())

    return parts.join(' > ')
  }

  window.cumulativeLayoutShiftScore = 0
  window.previousRect = []
  window.currentRect = []
  window.shifts = []
  window.sources = []
  let firstTs = Number.NEGATIVE_INFINITY
  let prevTs = Number.NEGATIVE_INFINITY

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.hadRecentInput) continue
      if (type === 'new') {
        if (entry.startTime - firstTs > 5000 || entry.startTime - prevTs > 1000) {
          firstTs = entry.startTime
          window.cumulativeLayoutShiftScore = 0
          window.shifts = []
        }
        prevTs = entry.startTime
      }

      entry.sources.forEach((e) => {
        window.previousRect.push(JSON.parse(JSON.stringify(e.previousRect)))
        window.currentRect.push(JSON.parse(JSON.stringify(e.currentRect)))
        window.shifts.push(entry.value)
      })

      window.sources.push({
        value: entry.value,
        elements: entry.sources.map((s) => getElementSelector(s.node))
      })

      window.cumulativeLayoutShiftScore += entry.value

      window.onload = (event) => {
        observer.takeRecords()
        observer.disconnect()
      }
    }
  })
  observer.observe({ type: 'layout-shift', buffered: true })
}

// Return the colours we're using for the CLS
const getColor = (cls) => {
  let c = {
    stroke: 'rgba(0,128,0,.7)',
    fill: 'rgba(0,128,0,.1)',
    solid: 'rgb(0,128,0,1)'
  }

  if (cls > 0.1) {
    c = {
      stroke: 'rgba(255,125,0,.5)',
      fill: 'rgba(255,125,0,.05)',
      solid: 'rgba(255,125,0,1)'
    }
  }

  if (cls > 0.25) {
    c = {
      stroke: 'rgba(255,0,0,.5)',
      fill: 'rgba(255,0,0,.05)',
      solid: 'rgba(255,0,0,1)'
    }
  }

  return c
}

const createGif = async (url, device) => {
  // Launch puppeteer
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, args: ['--no-sandbox'], timeout: 10000 })

  try {
    const page = await browser.newPage()
    if (options.cookies) {
      const cookies = JSON.parse(fs.readFileSync(options.cookies))
      await page.setCookie(...cookies)
    }
    const client = await page.target().createCDPSession()
    await client.send('Network.enable')
    await client.send('ServiceWorker.enable')

    // Throttle the network and CPU to give us a chance to actually capture layout shifts.
    await client.send('Network.emulateNetworkConditions', Good3G)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 })

    // Emulate a phone or standard desktop size.
    if (device === 'mobile') {
      await page.emulate(phone)
      await page.setViewport({
        width: 412,
        height: 732,
        deviceScaleFactor: 1
      })
      // Override viewport resolution if a width or height are manually supplied
      if (options.width || options.height) {
        await page.setViewport({
          width: options.width || page.viewport().width,
          height: options.height || page.viewport().height,
          deviceScaleFactor: 1
        })
      }
    } else {
      // Override viewport resolution if a width or height are manually supplied
      await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080
      })
    }

    // Initiate clsDetection at the earliest possible moment
    await page.evaluateOnNewDocument(clsDetection, options.type)

    // Navigate to the page and wait until it's hit the load event, 120s timeout for tries
    await page.goto(url, { waitUntil: 'load', timeout: 120000 })

    // Populate an object for everything we need to draw our final images
    const output = await page.evaluate(() => {
      return {
        score: window.cumulativeLayoutShiftScore,
        previousRect: window.previousRect,
        currentRect: window.currentRect,
        shifts: window.shifts,
        report: {
          url: window.location.href,
          cls: window.cumulativeLayoutShiftScore,
          entries: window.sources
        }
      }
    })
    output.scaleFactor = page.viewport().deviceScaleFactor || 1

    // Set up the tmp directory
    const tmpobj = tmp.dirSync()

    // Take a screenshot of the page after it's loaded.
    await page.screenshot({ path: tmpobj.name + '/temp-screenshot.png' })

    // Close the browser.
    browser.close()

    // Load the puppeteer screenshot from the fs
    const image = await loadImage(tmpobj.name + '/temp-screenshot.png')

    // Start a gif encoder at the resolution of our screenshot
    const encoder = new GIFEncoder(image.width, image.height)

    // GIF encoder settings
    encoder.start()
    encoder.setRepeat(0) // 0 for repeat, -1 for no-repeat
    encoder.setDelay(500) // frame delay in ms
    encoder.setQuality(20) // image quality. 10 is default.

    // Create our canvas
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')

    // Canvas setup function
    const canvasSetup = () => {
      // Add the screenshot to each frame
      ctx.drawImage(image, 0, 0, image.width, image.height)
      // Add the CLS score in the top left corner
      ctx.beginPath()
      ctx.rect(0, 0, 110 * output.scaleFactor, 36 * output.scaleFactor)
      ctx.fillStyle = getColor(output.score).solid
      ctx.fill()
      ctx.lineWidth = 2 * output.scaleFactor
      ctx.fillStyle = 'white'
      ctx.font = 18 * output.scaleFactor + 'px Arial'
      ctx.fillText('CLS: ' + output.score.toFixed(3), 8 * output.scaleFactor, 24 * output.scaleFactor)
    }
    // Setup the canvas for the first frame
    canvasSetup()

    // Output the first frame rects
    output.currentRect.forEach((d, k) => {
      ctx.strokeStyle = getColor(output.shifts[k]).stroke
      ctx.fillStyle = getColor(output.shifts[k]).fill
      ctx.beginPath()
      ctx.rect(d.x * output.scaleFactor, d.y * output.scaleFactor, d.width * output.scaleFactor, d.height * output.scaleFactor)
      ctx.stroke()
      ctx.fill()
    })
    // Add frame to the GIF
    encoder.addFrame(ctx)

    // Clear the first frame
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Setup the canvas for the second frame
    canvasSetup()

    // Output the the second frame rects
    ctx.setLineDash([5 * output.scaleFactor, 3 * output.scaleFactor])
    output.previousRect.forEach((d, k) => {
      ctx.strokeStyle = getColor(output.shifts[k]).stroke
      ctx.fillStyle = getColor(output.shifts[k]).fill
      ctx.beginPath()
      ctx.rect(d.x * output.scaleFactor, d.y * output.scaleFactor, d.width * output.scaleFactor, d.height * output.scaleFactor)
      ctx.stroke()
      ctx.fill()
    })
    // Add frame to the GIF
    encoder.addFrame(ctx)

    // Write the GIF
    encoder.finish()
    fs.writeFileSync(options.output, encoder.out.getData())

    // Save the report if requested
    if (options.report) {
      fs.writeFileSync(options.output.replace('.gif', '.json'), JSON.stringify(output.report))
    }

    // Pass back the CLS score
    return output.score.toFixed(3)
  } catch (error) {
    browser.close()
    throw (error)
  }
}

createGif(options.url, options.device, options.filename)
  .then(e => {
    let scoreColor = colors.green

    if (e > 0.1) scoreColor = colors.yellow
    if (e > 0.25) scoreColor = colors.red

    console.log(`Cumulative layout shift (CLS) ${scoreColor}${e}${colors.reset}`)
    console.log(`Image succesfully saved as ${colors.blue}${options.output}${colors.reset}`)
    if (options.report) console.log(`Report succesfully saved as ${colors.blue}${options.output.replace('.gif', '.json')}${colors.reset}`)
  })
  .catch(e => console.log(e))
