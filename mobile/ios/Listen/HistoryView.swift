//
//  HistoryView.swift
//  Listen
//
//  View for displaying transcription history
//

import SwiftUI

struct HistoryView: View {
    @ObservedObject var history = TranscriptionHistory.shared
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            List {
                ForEach(history.items) { item in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(item.text)
                            .font(.body)

                        HStack {
                            Text(item.timestamp, style: .relative)
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Spacer()

                            Button(action: {
                                UIPasteboard.general.string = item.text
                            }) {
                                Image(systemName: "doc.on.doc")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                .onDelete(perform: deleteItems)
            }
            .navigationTitle("History")
            .navigationBarItems(
                leading: Button("Clear") {
                    history.clear()
                },
                trailing: Button("Done") {
                    dismiss()
                }
            )
        }
    }

    private func deleteItems(at offsets: IndexSet) {
        history.items.remove(atOffsets: offsets)
    }
}

struct HistoryView_Previews: PreviewProvider {
    static var previews: some View {
        HistoryView()
    }
}
