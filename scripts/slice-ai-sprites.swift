import AppKit
import CoreGraphics
import Foundation

struct SheetJob {
    let sheet: String
    let names: [String]
}

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let outputDir = root.appendingPathComponent("src/assets/characters/generated-ai", isDirectory: true)
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

let jobs = [
    SheetJob(
        sheet: "/Users/yamashinakeita/.codex/generated_images/019eddb8-9744-72c0-a90b-4cf3483b5495/ig_0163e8cbc9374635016a3ea94db0bc81918e79fbfa73ebb5ff.png",
        names: ["gulliver", "crusoe", "mariner", "victor", "alice", "holmes", "van_helsing", "clarissa", "winston"]
    ),
    SheetJob(
        sheet: "/Users/yamashinakeita/.codex/generated_images/019eddb8-9744-72c0-a90b-4cf3483b5495/ig_0163e8cbc9374635016a3ea9bbbea08191bc5b9862a38b303a.png",
        names: ["pirate", "pirate_captain", "emperor_lilliput", "death_ship", "creature", "queen_hearts", "moriarty", "dracula", "big_brother"]
    )
]

func loadCGImage(path: String) throws -> CGImage {
    let url = URL(fileURLWithPath: path)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "slice-ai-sprites", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot load \(path)"])
    }
    return image
}

func makeTransparentPNG(from crop: CGImage, out: URL) throws {
    let width = crop.width
    let height = crop.height
    let bytesPerPixel = 4
    let bytesPerRow = width * bytesPerPixel
    var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: &pixels,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        throw NSError(domain: "slice-ai-sprites", code: 2)
    }
    context.draw(crop, in: CGRect(x: 0, y: 0, width: width, height: height))

    for y in 0..<height {
        for x in 0..<width {
            let i = y * bytesPerRow + x * bytesPerPixel
            let r = pixels[i]
            let g = pixels[i + 1]
            let b = pixels[i + 2]
            if g > 135 && r < 95 && b < 95 {
                pixels[i + 3] = 0
            } else if g > 110 && r < 120 && b < 120 {
                pixels[i + 3] = UInt8(max(0, Int(pixels[i + 3]) - 150))
            }
        }
    }

    guard let outContext = CGContext(
        data: &pixels,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ), let outImage = outContext.makeImage() else {
        throw NSError(domain: "slice-ai-sprites", code: 3)
    }
    let rep = NSBitmapImageRep(cgImage: outImage)
    guard let png = rep.representation(using: .png, properties: [:]) else {
        throw NSError(domain: "slice-ai-sprites", code: 4)
    }
    try png.write(to: out)
}

for job in jobs {
    let image = try loadCGImage(path: job.sheet)
    let cellW = image.width / 3
    let cellH = image.height / 3
    for (index, name) in job.names.enumerated() {
        let col = index % 3
        let row = index / 3
        let rect = CGRect(x: col * cellW, y: row * cellH, width: cellW, height: cellH)
        guard let crop = image.cropping(to: rect) else {
            throw NSError(domain: "slice-ai-sprites", code: 5, userInfo: [NSLocalizedDescriptionKey: "Cannot crop \(name)"])
        }
        try makeTransparentPNG(from: crop, out: outputDir.appendingPathComponent("\(name)-idle.png"))
    }
}

print("Sliced \(jobs.flatMap { $0.names }.count) AI sprites.")
