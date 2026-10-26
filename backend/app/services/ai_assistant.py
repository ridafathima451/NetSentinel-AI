import json
import logging
from typing import Any
from app.core.config import settings

logger = logging.getLogger("netsentinel.ai_assistant")

class AIAssistantService:
    """
    Evidence-grounded cybersecurity investigation assistant.
    Supports Google Gemini API via server-side environment variables or
    falls back cleanly to a local deterministic evidence synthesis engine.
    """

    @staticmethod
    def generate_investigation_guidance(
        alert_data: dict[str, Any] | None = None,
        dataset_meta: dict[str, Any] | None = None,
        model_meta: dict[str, Any] | None = None,
        custom_query: str | None = None,
    ) -> dict[str, Any]:
        """
        Synthesizes investigation notes, facts, hypotheses, and next steps.
        Guaranteed to run even if no API key is set.
        """
        api_key = settings.GEMINI_API_KEY

        # Extract actual observed facts
        observed_facts = []
        model_predictions = []
        hypotheses = []
        suggested_steps = []

        if alert_data:
            src_ip = alert_data.get("source_ip") or "Unknown"
            dst_ip = alert_data.get("destination_ip") or "Unknown"
            src_port = alert_data.get("source_port")
            dst_port = alert_data.get("destination_port")
            proto = alert_data.get("protocol") or "IP"
            score = alert_data.get("anomaly_score", 0.0)
            risk = alert_data.get("risk_level", "LOW")
            pred_label = alert_data.get("predicted_label", "Unknown")

            observed_facts.append(f"Network flow observed between {src_ip}:{src_port} and {dst_ip}:{dst_port} using {proto}.")
            if alert_data.get("timestamp_str"):
                observed_facts.append(f"Recorded timestamp: {alert_data.get('timestamp_str')}.")

            features_payload = alert_data.get("features_payload") or {}
            if features_payload:
                sample_feats = [f"{k}={v}" for k, v in list(features_payload.items())[:4]]
                observed_facts.append(f"Key traffic flow attributes: {', '.join(sample_feats)}.")

            model_predictions.append(f"Anomaly Detection Engine assigned normalized anomaly score of {score:.4f} (Priority: {risk}).")
            model_predictions.append(f"Classified event as: '{pred_label}'.")

            # Formulate grounded hypotheses
            if "port" in pred_label.lower() or (dst_port and dst_port in [21, 22, 23, 80, 443, 445, 3389, 8080]):
                hypotheses.append(f"Host {src_ip} may be attempting service reconnaissance against destination port {dst_port}.")
            if score > 0.8:
                hypotheses.append("Significant feature deviation indicates traffic pattern deviates sharply from normal baseline behavior.")
            else:
                hypotheses.append("Traffic exhibits moderate statistical variance; could represent benign burst or network jitter.")

            # Formulate actionable investigative steps (WITHOUT automatic execution)
            suggested_steps.append(f"Verify firewall/proxy logs for any concurrent connections originating from {src_ip}.")
            suggested_steps.append(f"Cross-reference {src_ip} against internal asset inventory and external threat intelligence.")
            suggested_steps.append(f"Inspect host {dst_ip} at time of alert to determine if port {dst_port} accepted the connection.")
            suggested_steps.append("Validate if this behavior corresponds to scheduled administrative tasks or vulnerability scanners.")
        else:
            observed_facts.append("No specific alert selected. Synthesizing system-wide investigation posture.")
            suggested_steps.append("Select a specific high-risk alert or investigation from the Alert Center for deep-dive analysis.")

        # If Gemini API key is present, attempt LLM enhancement with strict system instructions
        if api_key and api_key.strip():
            try:
                from google import genai
                client = genai.Client(api_key=api_key)

                system_instruction = (
                    "You are the NetSentinel AI Security Copilot. You are an expert incident response assistant. "
                    "Analyze the provided structured evidence. Strictly distinguish: "
                    "(1) Observed Facts, (2) Model Predictions (do NOT treat anomaly scores as definite proof), "
                    "(3) Hypotheses, and (4) Concrete investigation steps. "
                    "Never execute commands. Return output in valid JSON matching keys: "
                    "'summary', 'observed_facts', 'model_predictions', 'hypotheses', 'suggested_steps'."
                )

                prompt = (
                    f"Evidence:\n"
                    f"- Alert: {json.dumps(alert_data or {}, default=str)}\n"
                    f"- Dataset Context: {json.dumps(dataset_meta or {}, default=str)}\n"
                    f"- Analyst Question: {custom_query or 'Provide an initial incident assessment and investigation triage plan.'}\n"
                )

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[system_instruction, prompt],
                )

                raw_text = response.text.strip()
                # Parse JSON if returned in markdown code block
                if "```json" in raw_text:
                    raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_text:
                    raw_text = raw_text.split("```")[1].split("```")[0].strip()

                parsed = json.loads(raw_text)
                return {
                    "summary": parsed.get("summary", "AI synthesis generated."),
                    "observed_facts": parsed.get("observed_facts", observed_facts),
                    "model_predictions": parsed.get("model_predictions", model_predictions),
                    "hypotheses": parsed.get("hypotheses", hypotheses),
                    "suggested_steps": parsed.get("suggested_steps", suggested_steps),
                    "provider_used": "Gemini 2.5 Flash (via configured API key)",
                    "limitations_notice": "AI assistant output provides triage guidance only and does not constitute certified forensics.",
                }
            except Exception as e:
                logger.warning(f"Gemini API call failed or timed out: {e}. Falling back to local synthesis engine.")

        # Local deterministic synthesis
        summary = (
            f"Triage Assessment for Alert: Evaluated {len(observed_facts)} verified network flow facts. "
            f"The anomaly detection model evaluated this flow with an anomaly score of "
            f"{alert_data.get('anomaly_score', 0.0) if alert_data else 0.0:.2f}. "
            f"Recommended actions focus on asset verification and network evidence correlation."
        )

        return {
            "summary": summary,
            "observed_facts": observed_facts,
            "model_predictions": model_predictions,
            "hypotheses": hypotheses,
            "suggested_steps": suggested_steps,
            "provider_used": "Local Evidence-Grounded Engine (No API Key Required)",
            "limitations_notice": "Synthesized using local dataset attributes and ML feature attributions. Does not replace human analyst verification.",
        }

