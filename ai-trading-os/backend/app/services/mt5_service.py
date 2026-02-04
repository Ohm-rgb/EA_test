"""
MT5 Service - Real MetaTrader 5 Connection
Handles connection, authentication, and data retrieval from MT5 Terminal
"""
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class MT5ConnectionStatus(str, Enum):
    """MT5 Connection status states"""
    DISCONNECTED = "disconnected"
    CONNECTED = "connected"
    ERROR = "error"
    NOT_INSTALLED = "not_installed"


@dataclass
class MT5AccountInfo:
    """MT5 Account information"""
    login: int
    server: str
    balance: float
    equity: float
    margin: float
    margin_free: float
    currency: str
    leverage: int
    name: str
    company: str


@dataclass
class MT5ConnectionResult:
    """Result of MT5 connection attempt"""
    status: MT5ConnectionStatus
    message: str
    account_info: Optional[MT5AccountInfo] = None
    error_code: Optional[int] = None


class MT5Service:
    """
    Service for managing MetaTrader 5 connections.
    
    Note: MetaTrader5 library only works on Windows and requires
    MT5 Terminal to be installed and running.
    """
    
    def __init__(self):
        self._mt5_available = False
        self._connected = False
        self._check_mt5_available()
    
    def _check_mt5_available(self) -> bool:
        """Check if MetaTrader5 library is available"""
        try:
            import MetaTrader5 as mt5
            self._mt5_available = True
            return True
        except ImportError:
            logger.warning("MetaTrader5 library not installed")
            self._mt5_available = False
            return False
        except Exception as e:
            logger.error(f"Error checking MT5 availability: {e}")
            self._mt5_available = False
            return False
    
    def initialize(self) -> bool:
        """
        Initialize connection to MT5 Terminal.
        Must be called before any other MT5 operations.
        """
        if not self._mt5_available:
            return False
        
        try:
            import MetaTrader5 as mt5
            
            if not mt5.initialize():
                error_code = mt5.last_error()
                logger.error(f"MT5 initialize failed: {error_code}")
                return False
            
            return True
        except Exception as e:
            logger.error(f"MT5 initialization error: {e}")
            return False
    
    def shutdown(self) -> None:
        """Shutdown MT5 connection"""
        if not self._mt5_available:
            return
        
        try:
            import MetaTrader5 as mt5
            mt5.shutdown()
            self._connected = False
        except Exception as e:
            logger.error(f"MT5 shutdown error: {e}")
    
    def connect(self, server: str, login: int, password: str) -> MT5ConnectionResult:
        """
        Establish persistent connection to MT5.
        Alias for test_connection but semantically implies persistent usage.
        """
        return self.test_connection(server, login, password)

    def test_connection(
        self,
        server: str,
        login: int,
        password: str
    ) -> MT5ConnectionResult:
        """
        Test connection to MT5 with provided credentials.
        
        Args:
            server: MT5 broker server name
            login: Account login ID
            password: Account password
            
        Returns:
            MT5ConnectionResult with status and account info if successful
        """
        if not self._mt5_available:
            return MT5ConnectionResult(
                status=MT5ConnectionStatus.NOT_INSTALLED,
                message="MetaTrader5 library not installed. Please install it with: pip install MetaTrader5"
            )
        
        try:
            import MetaTrader5 as mt5
            
            # Initialize MT5 connection
            if not mt5.initialize():
                error = mt5.last_error()
                return MT5ConnectionResult(
                    status=MT5ConnectionStatus.ERROR,
                    message="MT5 Terminal not running. Please start MetaTrader 5.",
                    error_code=error[0] if error else None
                )
            
            # Attempt login
            authorized = mt5.login(
                login=login,
                password=password,
                server=server
            )
            
            if not authorized:
                error = mt5.last_error()
                mt5.shutdown()
                
                # Provide user-friendly error messages
                error_code = error[0] if error else 0
                if error_code == 10006:
                    message = "Connection failed - invalid server or no internet"
                elif error_code == 10004:
                    message = "Login failed - invalid credentials"
                else:
                    message = f"Login failed: {error[1] if error else 'Unknown error'}"
                
                return MT5ConnectionResult(
                    status=MT5ConnectionStatus.ERROR,
                    message=message,
                    error_code=error_code
                )
            
            # Get account info
            account_info = mt5.account_info()
            if account_info is None:
                mt5.shutdown()
                return MT5ConnectionResult(
                    status=MT5ConnectionStatus.ERROR,
                    message="Connected but failed to retrieve account info"
                )
            
            # Build result
            account = MT5AccountInfo(
                login=account_info.login,
                server=account_info.server,
                balance=account_info.balance,
                equity=account_info.equity,
                margin=account_info.margin,
                margin_free=account_info.margin_free,
                currency=account_info.currency,
                leverage=account_info.leverage,
                name=account_info.name,
                company=account_info.company
            )
            
            self._connected = True
            
            # Keep connection open for potential further operations
            # or shutdown here if only testing
            # mt5.shutdown()
            
            return MT5ConnectionResult(
                status=MT5ConnectionStatus.CONNECTED,
                message=f"Successfully connected to {server}",
                account_info=account
            )
            
        except Exception as e:
            logger.exception("MT5 connection error")
            return MT5ConnectionResult(
                status=MT5ConnectionStatus.ERROR,
                message=f"Connection error: {str(e)}"
            )
    
    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """
        Get current account information.
        Must be connected first.
        """
        if not self._mt5_available or not self._connected:
            return None
        
        try:
            import MetaTrader5 as mt5
            
            account_info = mt5.account_info()
            if account_info is None:
                return None
            
            return {
                "login": account_info.login,
                "server": account_info.server,
                "balance": account_info.balance,
                "equity": account_info.equity,
                "margin": account_info.margin,
                "margin_free": account_info.margin_free,
                "currency": account_info.currency,
                "leverage": account_info.leverage,
                "profit": account_info.profit,
                "name": account_info.name,
                "company": account_info.company
            }
        except Exception as e:
            logger.error(f"Error getting account info: {e}")
            return None
    
    def get_positions(self) -> list:
        """
        Get all open positions.
        Must be connected first.
        """
        if not self._mt5_available or not self._connected:
            return []
        
        try:
            import MetaTrader5 as mt5
            
            positions = mt5.positions_get()
            if positions is None:
                return []
            
            return [
                {
                    "ticket": pos.ticket,
                    "symbol": pos.symbol,
                    "type": "buy" if pos.type == 0 else "sell",
                    "volume": pos.volume,
                    "price_open": pos.price_open,
                    "price_current": pos.price_current,
                    "profit": pos.profit,
                    "sl": pos.sl,
                    "tp": pos.tp,
                    "time": pos.time,
                    "comment": pos.comment
                }
                for pos in positions
            ]
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            return []
    
    @property
    def is_available(self) -> bool:
        """Check if MT5 library is available"""
        return self._mt5_available
    
    @property
    def is_connected(self) -> bool:
        """Check if currently connected to MT5"""
        return self._connected


# Singleton instance
mt5_service = MT5Service()
