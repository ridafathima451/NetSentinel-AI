from collections import defaultdict
from typing import Any
from app.models.alert import Alert

class CorrelationEngine:
    """
    Transparent, rule-based correlation engine that clusters network alerts into incidents.
    All correlation reasons are grounded in shared observed network attributes.
    """

    @staticmethod
    def correlate_alerts(alerts: list[Alert]) -> list[dict[str, Any]]:
        """
        Groups alerts based on deterministic evidence:
        1. Repeated anomalous probes from same Source IP
        2. Focused attacks targeting the same Destination IP
        3. Port scan behaviors (same source IP touching >= 3 distinct destination ports)
        """
        incidents = []
        if not alerts:
            return incidents

        # Filter to alerts that have IP addresses
        ip_alerts = [a for a in alerts if a.source_ip or a.destination_ip]
        if not ip_alerts:
            # Fallback grouping by predicted label if IPs are absent in dataset
            label_groups = defaultdict(list)
            for a in alerts:
                if a.risk_level in ["HIGH", "CRITICAL"]:
                    label_groups[a.predicted_label].append(a)

            for label, group in label_groups.items():
                if len(group) >= 2:
                    incidents.append({
                        "title": f"Clustered {label} Activity ({len(group)} Events)",
                        "summary": f"Detected a cluster of {len(group)} high-risk events categorized as '{label}'.",
                        "correlation_reason": f"Shared predicted class: '{label}' with elevated risk scores.",
                        "target_entity": label,
                        "priority": "HIGH" if any(a.risk_level == "CRITICAL" for a in group) else "MEDIUM",
                        "alerts": group,
                    })
            return incidents

        # 1. Group by Source IP to detect outbound attackers / scanning
        src_ip_map = defaultdict(list)
        for a in ip_alerts:
            if a.source_ip:
                src_ip_map[a.source_ip].append(a)

        for src_ip, group in src_ip_map.items():
            if len(group) >= 2:
                # Check for port scan behavior
                dst_ports = {a.destination_port for a in group if a.destination_port is not None}
                if len(dst_ports) >= 3:
                    incidents.append({
                        "title": f"Suspected Port Scanning from {src_ip}",
                        "summary": f"Host {src_ip} generated {len(group)} anomalous probes across {len(dst_ports)} different destination ports ({sorted(list(dst_ports))[:5]}...).",
                        "correlation_reason": f"Shared source IP {src_ip} probing multiple distinct destination ports.",
                        "target_entity": src_ip,
                        "priority": "HIGH",
                        "alerts": group,
                    })
                else:
                    incidents.append({
                        "title": f"High Anomaly Volume from {src_ip}",
                        "summary": f"Source {src_ip} was responsible for {len(group)} correlated anomalous flows.",
                        "correlation_reason": f"Repeated high-risk network flows originating from source IP {src_ip}.",
                        "target_entity": src_ip,
                        "priority": "CRITICAL" if any(a.risk_level == "CRITICAL" for a in group) else "HIGH",
                        "alerts": group,
                    })

        # 2. Group by Destination IP to detect targeted victims / services
        dst_ip_map = defaultdict(list)
        for a in ip_alerts:
            if a.destination_ip:
                dst_ip_map[a.destination_ip].append(a)

        for dst_ip, group in dst_ip_map.items():
            if len(group) >= 3 and not any(inc["target_entity"] == dst_ip for inc in incidents):
                src_ips = {a.source_ip for a in group if a.source_ip}
                incidents.append({
                    "title": f"Targeted Activity Against Host {dst_ip}",
                    "summary": f"Destination {dst_ip} received {len(group)} anomalous events from {len(src_ips)} distinct sources.",
                    "correlation_reason": f"Common target host {dst_ip} subjected to repeated anomalous flows.",
                    "target_entity": dst_ip,
                    "priority": "HIGH" if any(a.risk_level == "CRITICAL" for a in group) else "MEDIUM",
                    "alerts": group,
                })

        return incidents

