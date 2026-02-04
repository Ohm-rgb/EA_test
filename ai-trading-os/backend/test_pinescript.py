"""
Comprehensive Pine Script Parsing Tests
Tests various indicator types: Simple, MTF, SMC, Session, Custom Functions
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1/chat/parse-pinescript?debug=true"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-token"
}

# ============================================================
# TEST CASES
# ============================================================

TEST_CASES = {
    "1_simple_rsi": {
        "name": "Simple RSI Strategy",
        "expected_indicators": ["RSI"],
        "expected_rules": 2,
        "script": """
//@version=5
strategy("RSI Strategy")
rsi = ta.rsi(close, 14)
if rsi < 30
    strategy.entry("Buy", strategy.long)
if rsi > 70
    strategy.close("Buy")
"""
    },
    
    "2_mtf_rsi": {
        "name": "Multi-Timeframe RSI",
        "expected_indicators": ["RSI"],
        "expected_rules": 2,
        "script": """
//@version=5
indicator("MTF RSI", overlay=false)

// Get RSI from Daily timeframe
dailyRSI = request.security(syminfo.tickerid, "D", ta.rsi(close, 14))

// Alerts
if dailyRSI < 30
    alert("Daily RSI Oversold", alert.freq_once_per_bar)
if dailyRSI > 70
    alert("Daily RSI Overbought", alert.freq_once_per_bar)

plot(dailyRSI, "Daily RSI", color.blue)
"""
    },
    
    "3_smc_indicator": {
        "name": "SMC with BOS/CHoCH/FVG",
        "expected_indicators": ["BOS", "CHoCH", "FVG"],
        "expected_rules": 4,
        "script": """
//@version=5
indicator("Smart Money Concepts", overlay=true)

// Break of Structure
bullishBOS = ta.crossover(high, ta.highest(high, 20)[1])
bearishBOS = ta.crossunder(low, ta.lowest(low, 20)[1])

// Change of Character
bullishCHoCH = bullishBOS and close[1] < open[1]
bearishCHoCH = bearishBOS and close[1] > open[1]

// Fair Value Gap detection (simplified)
bullishFVG = low > high[2]
bearishFVG = high < low[2]

// Alerts
alertcondition(bullishBOS, "Bullish BOS", "Break of Structure - Bullish")
alertcondition(bearishBOS, "Bearish BOS", "Break of Structure - Bearish") 
alertcondition(bullishFVG, "Bullish FVG", "Fair Value Gap - Bullish")
alertcondition(bearishFVG, "Bearish FVG", "Fair Value Gap - Bearish")
"""
    },
    
    "4_session_indicator": {
        "name": "FX Market Sessions",
        "expected_indicators": ["Session"],
        "expected_rules": 4,
        "script": """
//@version=5
indicator("FX Sessions", overlay=true)

// Session definitions
londonSession = time(timeframe.period, "0800-1600", "Europe/London")
nySession = time(timeframe.period, "0930-1600", "America/New_York")

// Session start/end detection
londonStart = londonSession and not londonSession[1]
londonEnd = not londonSession and londonSession[1]

// Alerts
alertcondition(londonStart, "London Open", "London session started")
alertcondition(londonEnd, "London Close", "London session ended")
alertcondition(nySession and not nySession[1], "NY Open", "New York session started")
alertcondition(not nySession and nySession[1], "NY Close", "New York session ended")
"""
    },
    
    "5_custom_function": {
        "name": "Custom Function Indicator",
        "expected_indicators": ["Custom"],
        "expected_rules": 2,
        "script": """
//@version=5
indicator("Custom ATR Bands", overlay=true)

// Custom function definition
f_atrBands(src, len, mult) =>
    atr = ta.atr(len)
    upper = src + atr * mult
    lower = src - atr * mult
    [upper, lower]

// Use custom function
[upperBand, lowerBand] = f_atrBands(close, 14, 2.0)

// Signals
buySignal = close < lowerBand
sellSignal = close > upperBand

alertcondition(buySignal, "Buy Signal", "Price below lower ATR band")
alertcondition(sellSignal, "Sell Signal", "Price above upper ATR band")

plot(upperBand, "Upper", color.red)
plot(lowerBand, "Lower", color.green)
"""
    },
    
    "6_ict_killzones": {
        "name": "ICT Killzones",
        "expected_indicators": ["Killzone", "Session"],
        "expected_rules": 3,
        "script": """
//@version=5
indicator("ICT Killzones", overlay=true)

// ICT Killzone times (EST)
asianKZ = time(timeframe.period, "2000-0000", "America/New_York")
londonKZ = time(timeframe.period, "0200-0500", "America/New_York") 
nyKZ = time(timeframe.period, "0700-1000", "America/New_York")

// Highlight killzones
bgcolor(asianKZ ? color.new(color.blue, 90) : na)
bgcolor(londonKZ ? color.new(color.green, 90) : na)
bgcolor(nyKZ ? color.new(color.red, 90) : na)

// Alerts
alertcondition(asianKZ and not asianKZ[1], "Asian KZ Start", "Asian Killzone Active")
alertcondition(londonKZ and not londonKZ[1], "London KZ Start", "London Killzone Active")
alertcondition(nyKZ and not nyKZ[1], "NY KZ Start", "NY Killzone Active")
"""
    },
    
    "7_complex_smc_mtf": {
        "name": "Complex SMC with MTF",
        "expected_indicators": ["BOS", "OrderBlock", "MTF"],
        "expected_rules": 4,
        "script": """
//@version=5
indicator("SMC MTF Strategy", overlay=true)

// Multi-timeframe structure
htfHigh = request.security(syminfo.tickerid, "D", ta.highest(high, 10))
htfLow = request.security(syminfo.tickerid, "D", ta.lowest(low, 10))

// Structure breaks
bullishBOS = ta.crossover(high, htfHigh[1])
bearishBOS = ta.crossunder(low, htfLow[1])

// Order Block detection (simplified)
bullishOB = bullishBOS and close[3] < open[3]
bearishOB = bearishBOS and close[3] > open[3]

// Alerts
alertcondition(bullishBOS, "Bullish BOS HTF", "Break of Structure on HTF - Long")
alertcondition(bearishBOS, "Bearish BOS HTF", "Break of Structure on HTF - Short")
alertcondition(bullishOB, "Bullish OB", "Bullish Order Block formed")
alertcondition(bearishOB, "Bearish OB", "Bearish Order Block formed")
"""
    }
}

# ============================================================
# TEST RUNNER
# ============================================================

def run_test(test_id: str, test_data: dict) -> dict:
    """Run a single test and return results"""
    print(f"\n{'='*60}")
    print(f"🧪 Test: {test_data['name']}")
    print(f"   ID: {test_id}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            BASE_URL, 
            json={"script": test_data["script"]}, 
            headers=HEADERS, 
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"❌ HTTP Error: {response.status_code}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
        
        result = response.json()
        
        # Analyze results
        print(f"\n📊 Results:")
        print(f"   Status: {result.get('status', 'unknown')}")
        print(f"   Indicators: {len(result.get('indicators', []))}")
        print(f"   Rules: {len(result.get('rules', []))}")
        
        if result.get('warning'):
            print(f"   ⚠️ Warning: {result['warning']}")
        
        if result.get('confidenceScore'):
            print(f"   Confidence: {result['confidenceScore']}%")
        
        # Print indicators
        if result.get('indicators'):
            print(f"\n   📌 Indicators:")
            for ind in result['indicators']:
                tf = f" [{ind.get('timeframe', 'current')}]" if ind.get('timeframe') else ""
                print(f"      - {ind.get('type', 'Unknown')} (id: {ind.get('id', '?')}){tf}")
        
        # Print rules
        if result.get('rules'):
            print(f"\n   📋 Rules:")
            for rule in result['rules'][:5]:  # Limit to 5 for readability
                print(f"      - {rule.get('indicator', '?')} {rule.get('operator', '?')} → {rule.get('action', '?')}")
        
        # Validation
        success = result.get('status') in ['success', 'partial']
        rules_count = len(result.get('rules', []))
        
        print(f"\n   ✅ Pass" if success else f"\n   ❌ Fail")
        
        return {
            "success": success,
            "status": result.get('status'),
            "indicators_count": len(result.get('indicators', [])),
            "rules_count": rules_count,
            "expected_rules": test_data.get('expected_rules', 0),
            "confidence": result.get('confidenceScore')
        }
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error - Is the backend running on localhost:8000?")
        return {"success": False, "error": "Connection refused"}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"success": False, "error": str(e)}


def run_all_tests():
    """Run all test cases"""
    print("\n" + "="*70)
    print("🚀 PINE SCRIPT PARSER - COMPREHENSIVE TEST SUITE")
    print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    results = {}
    passed = 0
    failed = 0
    
    for test_id, test_data in TEST_CASES.items():
        result = run_test(test_id, test_data)
        results[test_id] = result
        
        if result.get('success'):
            passed += 1
        else:
            failed += 1
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    print(f"   Total: {len(TEST_CASES)}")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   Rate: {passed/len(TEST_CASES)*100:.1f}%")
    
    # Detailed results table
    print("\n   Detailed Results:")
    print("   " + "-"*50)
    for test_id, result in results.items():
        status = "✅" if result.get('success') else "❌"
        rules = f"{result.get('rules_count', 0)}/{result.get('expected_rules', '?')}"
        conf = result.get('confidence', '-')
        print(f"   {status} {test_id}: rules={rules}, confidence={conf}")
    
    print("\n" + "="*70)
    return results


if __name__ == "__main__":
    run_all_tests()
