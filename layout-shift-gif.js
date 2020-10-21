#!/usr/bin/env node

/*
 * SPDX-License-Identifier: Apache-2.0
 */

/* Args */
const yargs = require('yargs')

const options = yargs
  .usage('Usage: --url <url> --device [mobile|desktop] --cookies <filename> --output <filename>')
  .example('layout-shift-gif --url https://blacklivesmatter.com/ --device mobile --output layoutshift.gif')
  .default({ device: 'mobile', cookies: null, output: 'layoutshift.gif' })
  .describe('url', 'Website url')
  .describe('device', 'Device type [mobile|desktop]')
  .describe('width', 'Override device viewport width')
  .describe('height', 'Override device viewport height')
  .describe('cookies', 'JSON file with the cookies to send with the request')
  .describe('output', 'Output filename')
  .demandOption(['url'])
  .argv

const puppeteer = require('puppeteer')
const devices = puppeteer.devices
const { createCanvas, loadImage } = require('canvas')
const GIFEncoder = require('gif-encoder-2')
const fs = require('fs')

/* Network conditions */
const Good3G = {
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8,
  uploadThroughput: 750 * 1024 / 8,
  latency: 40
}

/* Device for mobile emulation */
const phone = devices['Nexus 5X']

/* Detect layout shift */
function clsDetection () {
  window.cumulativeLayoutShiftScore = 0
  window.previousRect = []
  window.currentRect = []
  window.shifts = []

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        entry.sources.forEach((e) => {
          window.previousRect.push(JSON.parse(JSON.stringify(e.previousRect)))
          window.currentRect.push(JSON.parse(JSON.stringify(e.currentRect)))
          window.shifts.push(entry.value)
        })
        window.cumulativeLayoutShiftScore += entry.value
        window.onload = (event) => {
          observer.takeRecords()
          observer.disconnect()
        }
      }
    }
  })
  observer.observe({ type: 'layout-shift', buffered: true })
}

// Return the colours we're using for the CLS
function getColor (cls) {
  let c = { stroke: 'rgba(0,128,0,.7)', fill: 'rgba(0,128,0,.1)', solid: 'rgb(0,128,0,1)' }
  if (cls >= 0.1) {
    c = { stroke: 'rgba(255,125,0,.5)', fill: 'rgba(255,125,0,.05)', solid: 'rgba(255,125,0,1)' }
  }
  if (cls >= 0.25) {
    c = { stroke: 'rgba(255,0,0,.5)', fill: 'rgba(255,0,0,.05)', solid: 'rgba(255,0,0,1)' }
  }
  return c
}

async function createGif (url, device) {
  // Launch puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], timeout: 10000 })

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
      // Override viewport resolution if a width or height are manually supplied
      if (options.width || options.height) {
        await page.setViewport({
          width: options.width || page.viewport().width,
          height: options.height || page.viewport().height,
          deviceScaleFactor: page.viewport().deviceScaleFactor
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
    await page.evaluateOnNewDocument(clsDetection)

    // Navigate to the page and wait until it's hit the load event, 120s timeout for tries
    await page.goto(url, { waitUntil: 'load', timeout: 120000 })

    // Populate an object for everything we need to draw our final images
    const output = await page.evaluate(() => {
      return {
        score: window.cumulativeLayoutShiftScore,
        previousRect: window.previousRect,
        currentRect: window.currentRect,
        shifts: window.shifts
      }
    })
    output.scaleFactor = page.viewport().deviceScaleFactor || 1

    // Take a screenshot of the page after it's loaded.
    await page.screenshot({ path: 'temp-screenshot.png' })

    // Close the browser.
    browser.close()

    // Load the puppeteer screenshot from the fs
    const image = await loadImage('./temp-screenshot.png')

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
    const canvasSetup = function () {
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
    // Pass back the CLS score
    return 'CLS: ' + output.score.toFixed(3)
  } catch (error) {
    browser.close()
    throw (error)
  }
}

createGif(options.url, options.device, options.filename).then(e => console.log(e)).catch(e => console.log(e))
