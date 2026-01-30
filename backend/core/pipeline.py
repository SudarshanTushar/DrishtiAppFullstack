import random
import json
import time

class DataPipeline:
    """
    STAGE 1: ETL PIPELINE (Extract, Transform, Load)
    Prepares sensor and location data into text format for DistilBERT.
    """
    def __init__(self):
        self.sources = ["IOT_MESH", "GDELT_API"]

    def ingest_data(self, location: dict, rain_intensity: int):
        # In a real scenario, this fetches from DB/Sensors.
        # Here we structure the incoming request data.
        return {
            "location": location,
            "rain": rain_intensity,
            "timestamp": "Current"
        }

    def transform_data(self, raw_data):
        """
        Converts numerical sensor data into a Semantic Context String.
        DistilBERT was trained on text, so we must generate text.
        """
        loc = raw_data['location']
        rain = raw_data['rain']

        # Dynamic Text Generation based on input
        context_parts = [f"Situation report for sector near lat {loc['lat']} lng {loc['lng']}."]

        if rain > 50:
            context_parts.append("CRITICAL: Severe heavy rainfall and extreme flooding detected.")
            context_parts.append("Roads are likely submerged.")
        elif rain > 20:
            context_parts.append("WARNING: Moderate rainfall observed.")
            context_parts.append("Potential for slippery roads and minor logging.")
        else:
            context_parts.append("Weather conditions are normal.")
            context_parts.append("No immediate environmental threats reported.")

        return " ".join(context_parts)

    def load_payload(self, text_data):
        # Ready for Tokenizer
        return text_data