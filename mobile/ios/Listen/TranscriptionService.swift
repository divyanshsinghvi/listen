//
//  TranscriptionService.swift
//  Listen
//
//  Handles speech-to-text transcription using WhisperKit
//

import Foundation
import WhisperKit

class TranscriptionService: ObservableObject {
    @Published var isTranscribing = false
    private var whisperKit: WhisperKit?

    init() {
        Task {
            await loadModel()
        }
    }

    private func loadModel() async {
        do {
            // Use tiny model for speed, base for better accuracy
            whisperKit = try await WhisperKit(model: "tiny")
            print("WhisperKit model loaded successfully")
        } catch {
            print("Failed to load WhisperKit: \(error.localizedDescription)")
        }
    }

    func transcribe(audioURL: URL, completion: @escaping (Result<String, Error>) -> Void) {
        guard let whisperKit = whisperKit else {
            completion(.failure(NSError(domain: "TranscriptionService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Model not loaded"])))
            return
        }

        Task {
            do {
                isTranscribing = true

                // Transcribe the audio file
                let transcription = try await whisperKit.transcribe(audioPath: audioURL.path)

                // Extract text from segments
                let text = transcription?.text ?? ""

                DispatchQueue.main.async {
                    self.isTranscribing = false
                    completion(.success(text))
                }
            } catch {
                DispatchQueue.main.async {
                    self.isTranscribing = false
                    completion(.failure(error))
                }
            }
        }
    }
}

// Transcription History Manager
class TranscriptionHistory: ObservableObject {
    static let shared = TranscriptionHistory()

    @Published var items: [HistoryItem] = []
    private let maxItems = 20

    struct HistoryItem: Identifiable, Codable {
        let id: UUID
        let text: String
        let timestamp: Date

        init(text: String) {
            self.id = UUID()
            self.text = text
            self.timestamp = Date()
        }
    }

    private init() {
        loadHistory()
    }

    func add(_ text: String) {
        let item = HistoryItem(text: text)
        items.insert(item, at: 0)

        // Keep only recent items
        if items.count > maxItems {
            items = Array(items.prefix(maxItems))
        }

        saveHistory()
    }

    private func saveHistory() {
        if let encoded = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(encoded, forKey: "transcriptionHistory")
        }
    }

    private func loadHistory() {
        if let data = UserDefaults.standard.data(forKey: "transcriptionHistory"),
           let decoded = try? JSONDecoder().decode([HistoryItem].self, from: data) {
            items = decoded
        }
    }

    func clear() {
        items.removeAll()
        saveHistory()
    }
}
