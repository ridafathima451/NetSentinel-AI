from abc import ABC, abstractmethod
from typing import Any, Generator
import logging

logger = logging.getLogger("netsentinel.monitoring")

class BaseLiveTrafficAdapter(ABC):
    """
    Abstract interface for legitimate, authorized real-time network traffic sources.
    
    IMPORTANT SAFETY AND ETHICAL PRINCIPLES:
    1. NetSentinel AI NEVER captures traffic without explicit user authorization and local interface permissions.
    2. NetSentinel AI DOES NOT simulate fake live traffic or invent random packet events.
    3. Live monitoring is DISABLED BY DEFAULT and clearly marks status as DISCONNECTED / UNAVAILABLE
       until an authorized user explicitly connects an authenticated collector (e.g., PCAP tap, Zeek, or Suricata socket).
    """

    @abstractmethod
    def connect(self, config: dict[str, Any]) -> bool:
        """Establishes connection to authorized capture interface or log socket."""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Safely closes capture handle and releases system sockets."""
        pass

    @abstractmethod
    def is_connected(self) -> bool:
        """Returns True only if an authorized source is actively delivering packet flows."""
        pass

    @abstractmethod
    def stream_flows(self) -> Generator[dict[str, Any], None, None]:
        """Yields parsed flow feature dictionaries from the legitimate capture stream."""
        pass

class DefaultPassiveMonitoringAdapter(BaseLiveTrafficAdapter):
    """
    Default production-safe adapter.
    Reports UNAVAILABLE / DISCONNECTED until configured by a system administrator.
    """

    def __init__(self):
        self._is_active = False
        self._interface_name = None

    def connect(self, config: dict[str, Any]) -> bool:
        logger.info("Real-time monitoring adapter invoked. Verifying interface permissions.")
        # NetSentinel AI intentionally requires external authorized collector connection.
        self._is_active = False
        return False

    def disconnect(self) -> bool:
        self._is_active = False
        return True

    def is_connected(self) -> bool:
        return self._is_active

    def stream_flows(self) -> Generator[dict[str, Any], None, None]:
        if not self._is_active:
            logger.info("Live capture stream requested while adapter is disconnected.")
            return
            yield # empty generator

    def get_status(self) -> dict[str, Any]:
        return {
            "is_enabled": False,
            "status": "DISCONNECTED",
            "message": (
                "Real-time monitoring is disabled by default. To connect a live sensor, "
                "configure an authorized packet tap or Zeek/Suricata log socket with administrative permissions."
            ),
            "authorized_sources_supported": ["PCAP Socket", "Zeek JSON Log Stream", "Suricata EVE-JSON"],
        }

monitoring_adapter = DefaultPassiveMonitoringAdapter()
