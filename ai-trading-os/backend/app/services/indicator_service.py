"""
Indicator Calculation Service

Provides accurate technical indicator calculations for trading bot simulations.
All calculations follow standard financial formulas used in professional trading platforms.

Author: AI Trading OS
Version: 1.0.0
"""

import math
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class IndicatorType(Enum):
    """Supported indicator types"""

    RSI = "RSI"
    SMA = "SMA"
    EMA = "EMA"
    MACD = "MACD"
    BOLLINGER = "Bollinger Bands"
    ATR = "ATR"
    STOCHASTIC = "Stochastic"
    PRICE = "Price"
    VOLUME = "Volume"


@dataclass
class MACDResult:
    """MACD calculation result"""

    macd_line: float
    signal_line: float
    histogram: float


@dataclass
class BollingerResult:
    """Bollinger Bands calculation result"""

    upper: float
    middle: float
    lower: float
    bandwidth: float  # (upper - lower) / middle


@dataclass
class StochasticResult:
    """Stochastic calculation result"""

    k: float  # %K line
    d: float  # %D line (signal)


class IndicatorService:
    """
    Technical Indicator Calculation Service

    All methods are stateless and can be called independently.
    For efficiency in simulations, use the IndicatorCache class.
    """

    # =========================================================================
    # MOVING AVERAGES
    # =========================================================================

    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> Optional[float]:
        """
        Calculate Simple Moving Average

        Formula: SMA = Sum(prices) / period

        Args:
            prices: List of prices (most recent last)
            period: Number of periods

        Returns:
            SMA value or None if insufficient data
        """
        if len(prices) < period:
            return None

        return sum(prices[-period:]) / period

    @staticmethod
    def calculate_ema(
        prices: List[float], period: int, smoothing: float = 2.0
    ) -> Optional[float]:
        """
        Calculate Exponential Moving Average

        Formula: EMA = Price(t) * k + EMA(y) * (1 - k)
        where k = smoothing / (1 + period)

        Args:
            prices: List of prices (most recent last)
            period: Number of periods
            smoothing: Smoothing factor (default 2.0 for standard EMA)

        Returns:
            EMA value or None if insufficient data
        """
        if len(prices) < period:
            return None

        # Calculate multiplier
        k = smoothing / (period + 1)

        # Start with SMA for first EMA value
        ema = sum(prices[:period]) / period

        # Calculate EMA for remaining prices
        for price in prices[period:]:
            ema = (price * k) + (ema * (1 - k))

        return ema

    @staticmethod
    def calculate_ema_series(
        prices: List[float], period: int, smoothing: float = 2.0
    ) -> List[float]:
        """
        Calculate EMA series for all valid points

        Returns:
            List of EMA values (aligned with end of prices list)
        """
        if len(prices) < period:
            return []

        k = smoothing / (period + 1)
        ema_series = []

        # First EMA is SMA
        ema = sum(prices[:period]) / period
        ema_series.append(ema)

        # Calculate subsequent EMAs
        for price in prices[period:]:
            ema = (price * k) + (ema * (1 - k))
            ema_series.append(ema)

        return ema_series

    # =========================================================================
    # RSI (Relative Strength Index)
    # =========================================================================

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        """
        Calculate RSI using Wilder's Smoothing Method

        Formula:
            RSI = 100 - (100 / (1 + RS))
            RS = Average Gain / Average Loss

        Uses Wilder's smoothing (exponential) for accuracy.

        Args:
            prices: List of prices (most recent last)
            period: RSI period (default 14)

        Returns:
            RSI value (0-100) or None if insufficient data
        """
        if len(prices) < period + 1:
            return None

        # Calculate price changes
        changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]

        # Separate gains and losses
        gains = [max(0, change) for change in changes]
        losses = [abs(min(0, change)) for change in changes]

        # Initial averages (simple average for first period)
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        # Wilder's smoothing for subsequent values
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        # Calculate RSI
        if avg_loss == 0:
            return 100.0 if avg_gain > 0 else 50.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

        return round(rsi, 2)

    @staticmethod
    def calculate_rsi_series(prices: List[float], period: int = 14) -> List[float]:
        """
        Calculate RSI series for all valid points

        Returns:
            List of RSI values
        """
        if len(prices) < period + 1:
            return []

        changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
        gains = [max(0, change) for change in changes]
        losses = [abs(min(0, change)) for change in changes]

        rsi_series = []

        # Initial averages
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        # First RSI
        if avg_loss == 0:
            rsi_series.append(100.0 if avg_gain > 0 else 50.0)
        else:
            rs = avg_gain / avg_loss
            rsi_series.append(round(100 - (100 / (1 + rs)), 2))

        # Subsequent RSIs with Wilder's smoothing
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

            if avg_loss == 0:
                rsi_series.append(100.0 if avg_gain > 0 else 50.0)
            else:
                rs = avg_gain / avg_loss
                rsi_series.append(round(100 - (100 / (1 + rs)), 2))

        return rsi_series

    # =========================================================================
    # MACD (Moving Average Convergence Divergence)
    # =========================================================================

    @staticmethod
    def calculate_macd(
        prices: List[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9,
    ) -> Optional[MACDResult]:
        """
        Calculate MACD

        Formula:
            MACD Line = EMA(fast) - EMA(slow)
            Signal Line = EMA(MACD Line, signal_period)
            Histogram = MACD Line - Signal Line

        Args:
            prices: List of prices
            fast_period: Fast EMA period (default 12)
            slow_period: Slow EMA period (default 26)
            signal_period: Signal line period (default 9)

        Returns:
            MACDResult or None if insufficient data
        """
        min_required = slow_period + signal_period
        if len(prices) < min_required:
            return None

        # Calculate EMA series
        fast_ema_series = IndicatorService.calculate_ema_series(prices, fast_period)
        slow_ema_series = IndicatorService.calculate_ema_series(prices, slow_period)

        if not fast_ema_series or not slow_ema_series:
            return None

        # Align series (slow EMA starts later)
        offset = slow_period - fast_period
        aligned_fast = fast_ema_series[offset:]

        # Calculate MACD line series
        macd_series = [f - s for f, s in zip(aligned_fast, slow_ema_series)]

        if len(macd_series) < signal_period:
            return None

        # Calculate signal line (EMA of MACD)
        signal_series = IndicatorService.calculate_ema_series(
            macd_series, signal_period
        )

        if not signal_series:
            return None

        # Get latest values
        macd_line = macd_series[-1]
        signal_line = signal_series[-1]
        histogram = macd_line - signal_line

        return MACDResult(
            macd_line=round(macd_line, 4),
            signal_line=round(signal_line, 4),
            histogram=round(histogram, 4),
        )

    # =========================================================================
    # BOLLINGER BANDS
    # =========================================================================

    @staticmethod
    def calculate_bollinger_bands(
        prices: List[float], period: int = 20, std_dev: float = 2.0
    ) -> Optional[BollingerResult]:
        """
        Calculate Bollinger Bands

        Formula:
            Middle Band = SMA(period)
            Upper Band = Middle + (std_dev * Standard Deviation)
            Lower Band = Middle - (std_dev * Standard Deviation)

        Args:
            prices: List of prices
            period: SMA period (default 20)
            std_dev: Standard deviation multiplier (default 2.0)

        Returns:
            BollingerResult or None if insufficient data
        """
        if len(prices) < period:
            return None

        # Calculate middle band (SMA)
        recent_prices = prices[-period:]
        middle = sum(recent_prices) / period

        # Calculate standard deviation
        variance = sum((p - middle) ** 2 for p in recent_prices) / period
        std = math.sqrt(variance)

        # Calculate bands
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)

        # Bandwidth indicator
        bandwidth = (upper - lower) / middle if middle != 0 else 0

        return BollingerResult(
            upper=round(upper, 4),
            middle=round(middle, 4),
            lower=round(lower, 4),
            bandwidth=round(bandwidth, 4),
        )

    # =========================================================================
    # ATR (Average True Range)
    # =========================================================================

    @staticmethod
    def calculate_atr(
        highs: List[float], lows: List[float], closes: List[float], period: int = 14
    ) -> Optional[float]:
        """
        Calculate Average True Range

        Formula:
            TR = max(high - low, abs(high - prev_close), abs(low - prev_close))
            ATR = Wilder's smoothed average of TR

        Args:
            highs: List of high prices
            lows: List of low prices
            closes: List of close prices
            period: ATR period (default 14)

        Returns:
            ATR value or None if insufficient data
        """
        if (
            len(highs) < period + 1
            or len(lows) < period + 1
            or len(closes) < period + 1
        ):
            return None

        # Calculate True Range series
        true_ranges = []
        for i in range(1, len(highs)):
            high_low = highs[i] - lows[i]
            high_prev_close = abs(highs[i] - closes[i - 1])
            low_prev_close = abs(lows[i] - closes[i - 1])
            tr = max(high_low, high_prev_close, low_prev_close)
            true_ranges.append(tr)

        # Initial ATR (simple average)
        atr = sum(true_ranges[:period]) / period

        # Wilder's smoothing
        for tr in true_ranges[period:]:
            atr = (atr * (period - 1) + tr) / period

        return round(atr, 4)

    # =========================================================================
    # STOCHASTIC OSCILLATOR
    # =========================================================================

    @staticmethod
    def calculate_stochastic(
        highs: List[float],
        lows: List[float],
        closes: List[float],
        k_period: int = 14,
        d_period: int = 3,
    ) -> Optional[StochasticResult]:
        """
        Calculate Stochastic Oscillator

        Formula:
            %K = (Current Close - Lowest Low) / (Highest High - Lowest Low) * 100
            %D = SMA(%K, d_period)

        Args:
            highs: List of high prices
            lows: List of low prices
            closes: List of close prices
            k_period: %K period (default 14)
            d_period: %D period (default 3)

        Returns:
            StochasticResult or None if insufficient data
        """
        min_required = k_period + d_period - 1
        if (
            len(highs) < min_required
            or len(lows) < min_required
            or len(closes) < min_required
        ):
            return None

        # Calculate %K series
        k_series = []
        for i in range(k_period - 1, len(closes)):
            highest_high = max(highs[i - k_period + 1 : i + 1])
            lowest_low = min(lows[i - k_period + 1 : i + 1])

            if highest_high == lowest_low:
                k_series.append(50.0)  # Neutral when no range
            else:
                k = ((closes[i] - lowest_low) / (highest_high - lowest_low)) * 100
                k_series.append(k)

        # Calculate %D (SMA of %K)
        if len(k_series) < d_period:
            return None

        d = sum(k_series[-d_period:]) / d_period

        return StochasticResult(k=round(k_series[-1], 2), d=round(d, 2))


# =============================================================================
# CROSSES DETECTION
# =============================================================================


class CrossesDetector:
    """
    Detects crossing conditions between indicator values and thresholds/other indicators

    Requires historical data to properly detect crosses.
    """

    @staticmethod
    def crosses_above(
        current_value: float, previous_value: float, threshold: float
    ) -> bool:
        """
        Detect if value crosses above threshold

        Condition: previous <= threshold AND current > threshold

        Args:
            current_value: Current indicator value
            previous_value: Previous indicator value
            threshold: Threshold to cross

        Returns:
            True if crosses above, False otherwise
        """
        return previous_value <= threshold and current_value > threshold

    @staticmethod
    def crosses_below(
        current_value: float, previous_value: float, threshold: float
    ) -> bool:
        """
        Detect if value crosses below threshold

        Condition: previous >= threshold AND current < threshold

        Args:
            current_value: Current indicator value
            previous_value: Previous indicator value
            threshold: Threshold to cross

        Returns:
            True if crosses below, False otherwise
        """
        return previous_value >= threshold and current_value < threshold

    @staticmethod
    def indicator_crosses_above(
        current_value: float,
        previous_value: float,
        current_other: float,
        previous_other: float,
    ) -> bool:
        """
        Detect if one indicator crosses above another

        Condition: (prev_value <= prev_other) AND (curr_value > curr_other)

        Useful for: EMA crossovers, MACD signal crossovers
        """
        return previous_value <= previous_other and current_value > current_other

    @staticmethod
    def indicator_crosses_below(
        current_value: float,
        previous_value: float,
        current_other: float,
        previous_other: float,
    ) -> bool:
        """
        Detect if one indicator crosses below another

        Condition: (prev_value >= prev_other) AND (curr_value < curr_other)
        """
        return previous_value >= previous_other and current_value < current_other


# =============================================================================
# INDICATOR CACHE FOR SIMULATION
# =============================================================================


class IndicatorCache:
    """
    Efficient indicator calculation cache for simulations

    Pre-calculates indicator series to avoid redundant calculations
    during bar-by-bar simulation.
    """

    def __init__(
        self,
        prices: List[float],
        highs: Optional[List[float]] = None,
        lows: Optional[List[float]] = None,
    ):
        """
        Initialize cache with price data

        Args:
            prices: Close prices
            highs: High prices (optional, for ATR/Stochastic)
            lows: Low prices (optional, for ATR/Stochastic)
        """
        self.prices = prices
        self.highs = highs or prices
        self.lows = lows or prices
        self._cache: Dict[str, List[float]] = {}
        self._service = IndicatorService()

    def get_rsi(self, period: int = 14) -> List[float]:
        """Get cached RSI series"""
        key = f"rsi_{period}"
        if key not in self._cache:
            self._cache[key] = self._service.calculate_rsi_series(self.prices, period)
        return self._cache[key]

    def get_sma(self, period: int) -> List[float]:
        """Get cached SMA series"""
        key = f"sma_{period}"
        if key not in self._cache:
            series = []
            for i in range(period - 1, len(self.prices)):
                sma = self._service.calculate_sma(self.prices[: i + 1], period)
                if sma is not None:
                    series.append(sma)
            self._cache[key] = series
        return self._cache[key]

    def get_ema(self, period: int) -> List[float]:
        """Get cached EMA series"""
        key = f"ema_{period}"
        if key not in self._cache:
            self._cache[key] = self._service.calculate_ema_series(self.prices, period)
        return self._cache[key]

    def get_value_at_bar(
        self, indicator: str, bar_index: int, period: int = 14
    ) -> Optional[float]:
        """
        Get indicator value at specific bar index

        Args:
            indicator: Indicator type (RSI, SMA, EMA, Price)
            bar_index: Bar index in original price series
            period: Indicator period

        Returns:
            Indicator value or None if not available
        """
        if indicator.upper() == "PRICE":
            if 0 <= bar_index < len(self.prices):
                return self.prices[bar_index]
            return None

        if indicator.upper() == "RSI":
            series = self.get_rsi(period)
            # RSI series starts at index (period) in original prices
            series_index = bar_index - period
            if 0 <= series_index < len(series):
                return series[series_index]
            return None

        if indicator.upper() == "SMA":
            series = self.get_sma(period)
            series_index = bar_index - period + 1
            if 0 <= series_index < len(series):
                return series[series_index]
            return None

        if indicator.upper() == "EMA":
            series = self.get_ema(period)
            series_index = bar_index - period + 1
            if 0 <= series_index < len(series):
                return series[series_index]
            return None

        # Fallback to price
        if 0 <= bar_index < len(self.prices):
            return self.prices[bar_index]
        return None


# =============================================================================
# RULE EVALUATOR
# =============================================================================


class RuleEvaluator:
    """
    Evaluates trading rules against indicator values

    Supports proper crosses detection with historical context.
    """

    def __init__(self, cache: IndicatorCache):
        self.cache = cache
        self.crosses = CrossesDetector()

    def evaluate(
        self,
        indicator: str,
        operator: str,
        target_value: float,
        bar_index: int,
        period: int = 14,
    ) -> bool:
        """
        Evaluate a single rule condition

        Args:
            indicator: Indicator type
            operator: Comparison operator
            target_value: Target/threshold value
            bar_index: Current bar index
            period: Indicator period

        Returns:
            True if condition is met, False otherwise
        """
        current_val = self.cache.get_value_at_bar(indicator, bar_index, period)

        if current_val is None:
            return False

        # Simple comparisons
        if operator == "greater_than" or operator == ">":
            return current_val > target_value

        if operator == "less_than" or operator == "<":
            return current_val < target_value

        if operator == "equals" or operator == "==":
            return abs(current_val - target_value) < 0.01

        if operator == "greater_equal" or operator == ">=":
            return current_val >= target_value

        if operator == "less_equal" or operator == "<=":
            return current_val <= target_value

        # Crosses detection (requires previous value)
        if operator in ["crosses_above", "crosses_below"]:
            prev_val = self.cache.get_value_at_bar(indicator, bar_index - 1, period)

            if prev_val is None:
                return False

            if operator == "crosses_above":
                return self.crosses.crosses_above(current_val, prev_val, target_value)
            else:
                return self.crosses.crosses_below(current_val, prev_val, target_value)

        # Unknown operator - return False
        return False


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================


def calculate_all_indicators(
    prices: List[float],
    highs: Optional[List[float]] = None,
    lows: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """
    Calculate all standard indicators for the given price data

    Returns a dictionary with all indicator values at the most recent bar.
    """
    service = IndicatorService()
    highs = highs or prices
    lows = lows or prices

    result = {
        "rsi_14": service.calculate_rsi(prices, 14),
        "sma_20": service.calculate_sma(prices, 20),
        "sma_50": service.calculate_sma(prices, 50),
        "ema_12": service.calculate_ema(prices, 12),
        "ema_26": service.calculate_ema(prices, 26),
        "macd": service.calculate_macd(prices),
        "bollinger": service.calculate_bollinger_bands(prices),
        "atr_14": service.calculate_atr(highs, lows, prices, 14),
        "stochastic": service.calculate_stochastic(highs, lows, prices),
    }

    return result
