//
//  AudioRecorder.swift
//  Listen
//
//  Handles audio recording with AVFoundation
//

import Foundation
import AVFoundation

class AudioRecorder: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var audioFileURL: URL?

    private var audioRecorder: AVAudioRecorder?
    private var audioSession: AVAudioSession = AVAudioSession.sharedInstance()

    override init() {
        super.init()
        setupAudioSession()
    }

    private func setupAudioSession() {
        do {
            try audioSession.setCategory(.record, mode: .default)
            try audioSession.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error.localizedDescription)")
        }
    }

    func requestPermission(completion: @escaping (Bool) -> Void) {
        audioSession.requestRecordPermission { granted in
            DispatchQueue.main.async {
                completion(granted)
            }
        }
    }

    func startRecording() {
        requestPermission { [weak self] granted in
            guard granted else {
                print("Microphone permission denied")
                return
            }

            self?.startRecordingInternal()
        }
    }

    private func startRecordingInternal() {
        // Create a unique filename
        let fileName = "recording_\(Date().timeIntervalSince1970).wav"
        let documentPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioURL = documentPath.appendingPathComponent(fileName)

        // Configure recording settings for Whisper (16kHz, mono, 16-bit)
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatLinearPCM),
            AVSampleRateKey: 16000.0,
            AVNumberOfChannelsKey: 1,
            AVLinearPCMBitDepthKey: 16,
            AVLinearPCMIsFloatKey: false,
            AVLinearPCMIsBigEndianKey: false,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]

        do {
            audioRecorder = try AVAudioRecorder(url: audioURL, settings: settings)
            audioRecorder?.record()

            DispatchQueue.main.async {
                self.isRecording = true
                self.audioFileURL = audioURL
            }
        } catch {
            print("Failed to start recording: \(error.localizedDescription)")
        }
    }

    func stopRecording() {
        audioRecorder?.stop()

        DispatchQueue.main.async {
            self.isRecording = false
        }
    }

    func cleanup() {
        // Clean up old recordings (keep last 5)
        let documentPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]

        do {
            let files = try FileManager.default.contentsOfDirectory(
                at: documentPath,
                includingPropertiesForKeys: [.creationDateKey],
                options: .skipsHiddenFiles
            )

            let audioFiles = files.filter { $0.pathExtension == "wav" }
                .sorted {
                    let date1 = try? $0.resourceValues(forKeys: [.creationDateKey]).creationDate ?? Date.distantPast
                    let date2 = try? $1.resourceValues(forKeys: [.creationDateKey]).creationDate ?? Date.distantPast
                    return date1! > date2!
                }

            // Remove all but the 5 most recent
            for file in audioFiles.dropFirst(5) {
                try? FileManager.default.removeItem(at: file)
            }
        } catch {
            print("Cleanup error: \(error.localizedDescription)")
        }
    }
}
