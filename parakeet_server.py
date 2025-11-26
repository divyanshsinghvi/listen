#!/usr/bin/env python3
"""
Parakeet TDT Server
Long-running server that loads the model once and processes transcription requests.
Communicates via stdin/stdout using JSON messages.
"""
import sys
import json
import os
import logging

# Suppress NeMo and other library logging
os.environ['HYDRA_FULL_ERROR'] = '0'
logging.getLogger('nemo_logger').setLevel(logging.CRITICAL)
logging.getLogger('pytorch_lightning').setLevel(logging.CRITICAL)
logging.basicConfig(level=logging.CRITICAL)

import nemo.collections.asr as nemo_asr

class ParakeetServer:
    def __init__(self):
        self.models = {}
        sys.stderr.write('[SERVER] Starting ParakeetServer\n')
        sys.stderr.flush()
        # Ensure stdout is unbuffered
        sys.stdout = open(sys.stdout.fileno(), mode='w', buffering=1, encoding='utf8')
        sys.stdout.write(json.dumps({'status': 'starting'}) + '\n')
        sys.stdout.flush()

    def load_model(self, model_name):
        """Load model if not already loaded (cached)"""
        if model_name not in self.models:
            sys.stderr.write(f'[SERVER] Loading model: {model_name}\n')
            sys.stderr.flush()
            print(json.dumps({'status': 'loading', 'model': model_name}), flush=True)
            self.models[model_name] = nemo_asr.models.ASRModel.from_pretrained(model_name)
            sys.stderr.write(f'[SERVER] Model loaded: {model_name}\n')
            sys.stderr.flush()
        return self.models[model_name]

    def transcribe(self, audio_path, model_name, language='en'):
        """Transcribe audio file"""
        try:
            # Load model (will be cached if already loaded)
            asr_model = self.load_model(model_name)

            # Set language if multilingual
            if 'v3' in model_name and language != 'en':
                asr_model.change_decoding_strategy(None)

            # Transcribe
            result = asr_model.transcribe([audio_path])[0]

            # Extract text and confidence
            transcription = result.text if hasattr(result, 'text') else str(result)
            confidence = result.confidence if hasattr(result, 'confidence') else 0.95

            return {
                'text': transcription,
                'confidence': float(confidence)
            }
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")

    def run(self):
        """Main server loop - read requests from stdin, write responses to stdout"""
        sys.stderr.write('[SERVER] Ready to accept requests\n')
        sys.stderr.flush()

        # Send ready message multiple times to ensure it's received
        for _ in range(5):
            sys.stdout.write(json.dumps({'status': 'ready'}) + '\n')
            sys.stdout.flush()
            import time
            time.sleep(0.1)

        while True:
            try:
                # Read request from stdin
                request_line = sys.stdin.readline()
                if not request_line:
                    break

                request = json.loads(request_line.strip())

                # Process transcription request
                audio_path = request.get('audio_path')
                model_name = request.get('model_name')
                language = request.get('language', 'en')

                if not audio_path or not model_name:
                    response = {'error': 'Missing audio_path or model_name'}
                else:
                    result = self.transcribe(audio_path, model_name, language)
                    response = {'text': result['text'], 'confidence': result['confidence']}

                # Send response
                sys.stdout.write(json.dumps(response) + '\n')
                sys.stdout.flush()

            except json.JSONDecodeError as e:
                sys.stdout.write(json.dumps({'error': f'Invalid JSON: {str(e)}'}) + '\n')
                sys.stdout.flush()
            except Exception as e:
                sys.stdout.write(json.dumps({'error': str(e)}) + '\n')
                sys.stdout.flush()


if __name__ == '__main__':
    try:
        server = ParakeetServer()
        server.run()
    except KeyboardInterrupt:
        print(json.dumps({'status': 'shutting_down'}), flush=True)
    except Exception as e:
        print(json.dumps({'error': str(e)}), flush=True)
