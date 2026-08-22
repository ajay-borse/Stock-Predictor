import math
from decimal import Decimal, InvalidOperation

from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .predictor import predict_stock
from .download_data import download_stock
from .models import Watchlist, Holding, Transaction
from .serializers import TransactionSerializer


# ============================================================
# CACHE
# ============================================================

HISTORY_CACHE_TIMEOUT = 15 * 60


# ============================================================
# STOCK PREDICTION
# ============================================================

class StockPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        symbol = request.data.get("symbol")

        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        result = predict_stock(symbol)

        if "error" not in result:
            Notification.objects.create(user=request.user, message=f"AI prediction ready for {symbol}.", notification_type=Notification.PREDICTION)
        return Response(result)


# ============================================================
# STOCK HISTORY
# ============================================================

class StockHistoryView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        symbol = request.query_params.get("symbol")

        if not symbol:
            return Response(
                {"error": "Stock symbol is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        cache_key = f"stock_history_{symbol}"

        cached_data = cache.get(cache_key)

        if cached_data is not None:

            print(
                f"Returning cached historical data for: {symbol}"
            )

            return Response(cached_data)

        print(
            f"Cache miss. Downloading historical data for: {symbol}"
        )

        data = download_stock(symbol)

        if data is None or data.empty:

            return Response(
                {
                    "error":
                    f"No historical data found for {symbol}"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Handle yfinance MultiIndex columns
        if (
            hasattr(data.columns, "nlevels")
            and data.columns.nlevels > 1
        ):
            data.columns = data.columns.get_level_values(0)

        historical_data = []

        for date, row in data.iterrows():

            try:

                open_price = float(row["Open"])
                high = float(row["High"])
                low = float(row["Low"])
                close = float(row["Close"])
                volume = float(row["Volume"])

                values = [
                    open_price,
                    high,
                    low,
                    close,
                    volume
                ]

                if not all(
                    math.isfinite(value)
                    for value in values
                ):
                    continue

                historical_data.append(
                    {
                        "date": date.strftime("%Y-%m-%d"),
                        "open": open_price,
                        "high": high,
                        "low": low,
                        "close": close,
                        "volume": int(volume)
                    }
                )

            except (
                TypeError,
                ValueError,
                KeyError
            ):
                continue

        if not historical_data:

            return Response(
                {
                    "error":
                    f"No valid historical data found for {symbol}"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        response_data = {
            "symbol": symbol,
            "period": "1y",
            "interval": "1d",
            "data": historical_data
        }

        cache.set(
            cache_key,
            response_data,
            HISTORY_CACHE_TIMEOUT
        )

        print(
            f"Historical data cached for: {symbol}"
        )

        return Response(response_data)


# ============================================================
# WATCHLIST
# ============================================================

class WatchlistView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        watchlist = Watchlist.objects.filter(
            user=request.user
        )

        data = []

        for item in watchlist:

            data.append(
                {
                    "id": item.id,
                    "symbol": item.symbol,
                    "created_at": item.created_at
                }
            )

        return Response(data)

    def post(self, request):

        symbol = request.data.get("symbol")

        if not symbol:

            return Response(
                {
                    "error":
                    "Stock symbol is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        watchlist_item, created = Watchlist.objects.get_or_create(
            user=request.user,
            symbol=symbol
        )

        if not created:

            return Response(
                {
                    "message":
                    f"{symbol} is already in your watchlist.",
                    "symbol": symbol
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message":
                f"{symbol} added to your watchlist.",
                "id": watchlist_item.id,
                "symbol": watchlist_item.symbol
            },
            status=status.HTTP_201_CREATED
        )

    def delete(self, request):

        symbol = request.query_params.get("symbol")

        if not symbol:

            return Response(
                {
                    "error":
                    "Stock symbol is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        deleted_count, _ = Watchlist.objects.filter(
            user=request.user,
            symbol=symbol
        ).delete()

        if deleted_count == 0:

            return Response(
                {
                    "error":
                    f"{symbol} is not in your watchlist."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "message":
                f"{symbol} removed from your watchlist."
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# BUY STOCK
# ============================================================

class BuyStockView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        symbol = request.data.get("symbol")
        quantity = request.data.get("quantity")
        price = request.data.get("price")

        if not symbol:

            return Response(
                {
                    "error":
                    "Stock symbol is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)

        except (TypeError, ValueError):

            return Response(
                {
                    "error":
                    "Quantity must be a valid integer"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:

            return Response(
                {
                    "error":
                    "Quantity must be greater than 0"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            price = Decimal(str(price))

        except (
            InvalidOperation,
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Price must be a valid number"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if price <= 0:

            return Response(
                {
                    "error":
                    "Price must be greater than 0"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        total_amount = price * quantity

        holding, created = Holding.objects.get_or_create(
            user=request.user,
            symbol=symbol,
            defaults={
                "quantity": quantity,
                "average_buy_price": price
            }
        )

        if not created:

            old_quantity = holding.quantity
            old_average_price = holding.average_buy_price

            new_quantity = old_quantity + quantity

            new_average_price = (
                (
                    Decimal(old_quantity)
                    * old_average_price
                )
                +
                (
                    Decimal(quantity)
                    * price
                )
            ) / Decimal(new_quantity)

            holding.quantity = new_quantity
            holding.average_buy_price = new_average_price

            holding.save()

        transaction = Transaction.objects.create(
            user=request.user,
            symbol=symbol,
            transaction_type=Transaction.BUY,
            quantity=quantity,
            price=price,
            total_amount=total_amount
        )

        return Response(
            {
                "message":
                f"{symbol} purchased successfully.",

                "transaction": {
                    "id": transaction.id,
                    "symbol": transaction.symbol,
                    "type": transaction.transaction_type,
                    "quantity": transaction.quantity,
                    "price": float(transaction.price),
                    "total_amount":
                    float(transaction.total_amount),
                    "created_at":
                    transaction.created_at
                },

                "holding": {
                    "symbol": holding.symbol,
                    "quantity": holding.quantity,
                    "average_buy_price":
                    float(
                        holding.average_buy_price
                    )
                }
            },
            status=status.HTTP_201_CREATED
        )


# ============================================================
# SELL STOCK
# ============================================================

class SellStockView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        symbol = request.data.get("symbol")
        quantity = request.data.get("quantity")
        price = request.data.get("price")

        if not symbol:

            return Response(
                {
                    "error":
                    "Stock symbol is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        symbol = symbol.strip().upper()

        try:
            quantity = int(quantity)

        except (TypeError, ValueError):

            return Response(
                {
                    "error":
                    "Quantity must be a valid integer"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity <= 0:

            return Response(
                {
                    "error":
                    "Quantity must be greater than 0"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            price = Decimal(str(price))

        except (
            InvalidOperation,
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error":
                    "Price must be a valid number"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if price <= 0:

            return Response(
                {
                    "error":
                    "Price must be greater than 0"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            holding = Holding.objects.get(
                user=request.user,
                symbol=symbol
            )

        except Holding.DoesNotExist:

            return Response(
                {
                    "error":
                    f"You do not own any shares of {symbol}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > holding.quantity:

            return Response(
                {
                    "error":
                    f"You only own {holding.quantity} "
                    f"shares of {symbol}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        total_amount = price * quantity

        holding.quantity -= quantity

        if holding.quantity == 0:

            holding.delete()

            holding_response = None

        else:

            holding.save()

            holding_response = {
                "symbol": holding.symbol,
                "quantity": holding.quantity,
                "average_buy_price":
                float(
                    holding.average_buy_price
                )
            }

        transaction = Transaction.objects.create(
            user=request.user,
            symbol=symbol,
            transaction_type=Transaction.SELL,
            quantity=quantity,
            price=price,
            total_amount=total_amount
        )

        return Response(
            {
                "message":
                f"{symbol} sold successfully.",

                "transaction": {
                    "id": transaction.id,
                    "symbol": transaction.symbol,
                    "type": transaction.transaction_type,
                    "quantity": transaction.quantity,
                    "price": float(transaction.price),
                    "total_amount":
                    float(transaction.total_amount),
                    "created_at":
                    transaction.created_at
                },

                "holding": holding_response
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# PORTFOLIO
# ============================================================

class PortfolioView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        holdings = Holding.objects.filter(
            user=request.user
        )

        data = []

        total_invested = Decimal("0")

        for holding in holdings:

            invested_amount = (
                Decimal(holding.quantity)
                * holding.average_buy_price
            )

            total_invested += invested_amount

            data.append(
                {
                    "id": holding.id,
                    "symbol": holding.symbol,
                    "quantity": holding.quantity,
                    "average_buy_price":
                    float(
                        holding.average_buy_price
                    ),
                    "invested_amount":
                    float(invested_amount),
                    "created_at":
                    holding.created_at,
                    "updated_at":
                    holding.updated_at
                }
            )

        return Response(
            {
                "holdings": data,
                "total_invested":
                float(total_invested),
                "number_of_holdings":
                len(data)
            }
        )


# ============================================================
# TRANSACTION LIST
# ============================================================

class TransactionListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).order_by('-created_at')
        
        if not transactions.exists():
            return Response([])
            
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)


# ============================================================
# PORTFOLIO ANALYTICS
# ============================================================

class PortfolioAnalyticsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        holdings = Holding.objects.filter(
            user=request.user
        )

        if not holdings.exists():

            return Response(
                {
                    "message":
                    "Your portfolio is empty.",
                    "total_invested": 0,
                    "current_value": 0,
                    "total_profit_loss": 0,
                    "profit_loss_percentage": 0,
                    "holdings": []
                }
            )

        analytics = []

        total_invested = Decimal("0")
        total_current_value = Decimal("0")

        best_performer = None
        worst_performer = None

        for holding in holdings:

            symbol = holding.symbol
            quantity = holding.quantity
            average_buy_price = (
                holding.average_buy_price
            )

            invested_amount = (
                Decimal(quantity)
                * average_buy_price
            )

            total_invested += invested_amount

            # ------------------------------------------------
            # Download latest market data
            # ------------------------------------------------

            try:

                data = download_stock(symbol)

                if data is None or data.empty:

                    continue

                # Handle MultiIndex
                if (
                    hasattr(data.columns, "nlevels")
                    and data.columns.nlevels > 1
                ):
                    data.columns = (
                        data.columns
                        .get_level_values(0)
                    )

                latest_close = float(
                    data["Close"].iloc[-1]
                )

                if not math.isfinite(
                    latest_close
                ):
                    continue

                current_price = Decimal(
                    str(latest_close)
                )

            except (
                TypeError,
                ValueError,
                KeyError,
                IndexError
            ):

                continue

            # ------------------------------------------------
            # Calculate values
            # ------------------------------------------------

            current_value = (
                Decimal(quantity)
                * current_price
            )

            profit_loss = (
                current_value
                - invested_amount
            )

            if invested_amount > 0:

                profit_loss_percentage = (
                    profit_loss
                    / invested_amount
                ) * Decimal("100")

            else:

                profit_loss_percentage = Decimal("0")

            total_current_value += current_value

            holding_data = {
                "id": holding.id,
                "symbol": symbol,
                "quantity": quantity,

                "average_buy_price":
                float(average_buy_price),

                "current_price":
                float(current_price),

                "invested_amount":
                float(invested_amount),

                "current_value":
                float(current_value),

                "profit_loss":
                float(profit_loss),

                "profit_loss_percentage":
                float(
                    profit_loss_percentage
                )
            }

            analytics.append(
                holding_data
            )

            # ------------------------------------------------
            # Best performer
            # ------------------------------------------------

            if (
                best_performer is None
                or profit_loss_percentage
                > best_performer[
                    "profit_loss_percentage"
                ]
            ):

                best_performer = holding_data

            # ------------------------------------------------
            # Worst performer
            # ------------------------------------------------

            if (
                worst_performer is None
                or profit_loss_percentage
                < worst_performer[
                    "profit_loss_percentage"
                ]
            ):

                worst_performer = holding_data

        # ----------------------------------------------------
        # Overall portfolio P/L
        # ----------------------------------------------------

        total_profit_loss = (
            total_current_value
            - total_invested
        )

        if total_invested > 0:

            total_profit_loss_percentage = (
                total_profit_loss
                / total_invested
            ) * Decimal("100")

        else:

            total_profit_loss_percentage = Decimal("0")

        return Response(
            {
                "total_invested":
                float(total_invested),

                "current_value":
                float(total_current_value),

                "total_profit_loss":
                float(total_profit_loss),

                "profit_loss_percentage":
                float(
                    total_profit_loss_percentage
                ),

                "number_of_holdings":
                len(analytics),

                "best_performer":
                best_performer,

                "worst_performer":
                worst_performer,

                "holdings":
                analytics
            }
        )
# ============================================================
# MARKET OVERVIEW
# ============================================================

class MarketOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = "market_overview_data"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)

        # 1. Market Indices
        indices_map = {
            "^NSEI": "NIFTY 50",
            "^BSESN": "SENSEX",
            "^NSEBANK": "NIFTY BANK",
            "^INDIAVIX": "INDIA VIX"
        }
        
        indices_data = []
        for symbol, name in indices_map.items():
            try:
                data = download_stock(symbol)
                if data is not None and not data.empty:
                    if hasattr(data.columns, "nlevels") and data.columns.nlevels > 1:
                        data.columns = data.columns.get_level_values(0)
                        
                    latest_close = float(data["Close"].iloc[-1])
                    prev_close = float(data["Close"].iloc[-2]) if len(data) > 1 else latest_close
                    change = latest_close - prev_close
                    pct_change = (change / prev_close) * 100 if prev_close != 0 else 0
                    
                    indices_data.append({
                        "name": name,
                        "symbol": symbol,
                        "price": latest_close,
                        "change": change,
                        "change_percent": pct_change
                    })
            except Exception:
                continue

        # 2. Popular Stocks
        popular_symbols = [
            "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", 
            "ICICIBANK.NS", "SBIN.NS", "TATAMOTORS.NS", "ITC.NS"
        ]
        
        popular_stocks_data = []
        for symbol in popular_symbols:
            try:
                data = download_stock(symbol)
                if data is not None and not data.empty:
                    if hasattr(data.columns, "nlevels") and data.columns.nlevels > 1:
                        data.columns = data.columns.get_level_values(0)
                        
                    latest_close = float(data["Close"].iloc[-1])
                    prev_close = float(data["Close"].iloc[-2]) if len(data) > 1 else latest_close
                    change = latest_close - prev_close
                    pct_change = (change / prev_close) * 100 if prev_close != 0 else 0
                    
                    popular_stocks_data.append({
                        "symbol": symbol,
                        "price": latest_close,
                        "change": change,
                        "change_percent": pct_change
                    })
            except Exception:
                continue

        # 3. Top Movers (Gainers / Losers)
        sorted_by_change = sorted(popular_stocks_data, key=lambda x: x["change_percent"])
        losers = sorted_by_change[:3] if len(sorted_by_change) >= 3 else sorted_by_change
        gainers = sorted_by_change[-3:] if len(sorted_by_change) >= 3 else sorted_by_change
        gainers.reverse()

        # 4. Market Status (Approximate logic: just check if it's weekday)
        import datetime
        now = datetime.datetime.now()
        # Simple heuristic: weekday and time between 9:15 and 15:30 IST
        # We'll just return OPEN or CLOSED for simplicity, or "CLOSED" if it's weekend
        market_status = "OPEN"
        if now.weekday() >= 5:
            market_status = "CLOSED"
        
        response_data = {
            "market_status": market_status,
            "indices": indices_data,
            "popular_stocks": popular_stocks_data[:6],
            "gainers": gainers,
            "losers": losers
        }
        
        cache.set(cache_key, response_data, 300)  # 5 minutes cache
        
        return Response(response_data)

# ============================================================
# STOCK SEARCH
# ============================================================

class StockSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        query_lower = query.lower()
        cache_key = f"stock_search_{query_lower}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        results_dict = {}

        # 1. Local curated Indian stocks
        POPULAR_INDIAN_STOCKS = [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries"},
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services"},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank"},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank"},
            {"symbol": "INFY.NS", "name": "Infosys"},
            {"symbol": "SBIN.NS", "name": "State Bank of India"},
            {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel"},
            {"symbol": "ITC.NS", "name": "ITC Limited"},
            {"symbol": "LT.NS", "name": "Larsen & Toubro"},
            {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance"},
            {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank"},
            {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever"},
            {"symbol": "AXISBANK.NS", "name": "Axis Bank"},
            {"symbol": "WIPRO.NS", "name": "Wipro"},
            {"symbol": "ASIANPAINT.NS", "name": "Asian Paints"},
            {"symbol": "HCLTECH.NS", "name": "HCL Technologies"},
            {"symbol": "MARUTI.NS", "name": "Maruti Suzuki"},
            {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical"},
            {"symbol": "TITAN.NS", "name": "Titan Company"},
            {"symbol": "TATAMOTORS.NS", "name": "Tata Motors"},
            {"symbol": "NTPC.NS", "name": "NTPC Limited"},
            {"symbol": "TATASTEEL.NS", "name": "Tata Steel"},
            {"symbol": "POWERGRID.NS", "name": "Power Grid Corporation"},
            {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv"},
            {"symbol": "M&M.NS", "name": "Mahindra & Mahindra"},
            {"symbol": "ONGC.NS", "name": "ONGC"},
            {"symbol": "COALINDIA.NS", "name": "Coal India"}
        ]

        for s in POPULAR_INDIAN_STOCKS:
            if query_lower in s['symbol'].lower() or query_lower in s['name'].lower():
                results_dict[s['symbol']] = {
                    "symbol": s['symbol'],
                    "name": s['name'],
                    "exchange": "NSE",
                    "type": "EQUITY"
                }

        # 2. Yahoo Finance Search (for wider coverage)
        try:
            import yfinance as yf
            # If the user's query is short, we append " India" just for the yfinance search to help it find Indian stocks,
            # but only if the user hasn't explicitly specified .NS or .BO
            yf_query = query
            if len(query) <= 4 and '.' not in query:
                yf_query = query + " India"
                
            search_res = yf.Search(yf_query, max_results=30)
            if hasattr(search_res, 'quotes'):
                for q in search_res.quotes:
                    symbol = q.get('symbol', '')
                    if not symbol:
                        continue
                        
                    # STRICTLY FILTER ONLY INDIAN STOCKS
                    if symbol.endswith('.NS') or symbol.endswith('.BO'):
                        if symbol not in results_dict:
                            exch = "NSE" if symbol.endswith('.NS') else "BSE"
                            results_dict[symbol] = {
                                "symbol": symbol,
                                "name": q.get('shortname', q.get('longname', '')),
                                "exchange": exch,
                                "type": "EQUITY"
                            }
                            
            # Also try without " India" if we appended it and got nothing
            if len(query) <= 4 and '.' not in query and len(results_dict) == 0:
                search_res2 = yf.Search(query, max_results=30)
                if hasattr(search_res2, 'quotes'):
                    for q in search_res2.quotes:
                        symbol = q.get('symbol', '')
                        if symbol.endswith('.NS') or symbol.endswith('.BO'):
                            if symbol not in results_dict:
                                exch = "NSE" if symbol.endswith('.NS') else "BSE"
                                results_dict[symbol] = {
                                    "symbol": symbol,
                                    "name": q.get('shortname', q.get('longname', '')),
                                    "exchange": exch,
                                    "type": "EQUITY"
                                }

        except Exception as e:
            print(f"Search API error: {e}")

        # 3. Sort Results
        def get_rank(item):
            sym = item['symbol'].lower()
            name = item['name'].lower()
            q = query_lower
            
            # Rank 1: Exact symbol match before dot (e.g. TCS == TCS.NS)
            if sym.startswith(q + "."): return 1
            # Rank 2: Symbol starts with query
            if sym.startswith(q): return 2
            # Rank 3: Name starts with query
            if name.startswith(q): return 3
            # Rank 4: Name contains query
            if q in name: return 4
            # Rank 5: Fallback NSE
            if sym.endswith('.ns'): return 5
            return 6

        final_list = list(results_dict.values())
        final_list = sorted(final_list, key=lambda x: (get_rank(x), x['symbol']))
        final_list = final_list[:6]

        cache.set(cache_key, final_list, 86400)
        return Response(final_list)


# ============================================================
# NOTIFICATIONS
# ============================================================

from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)
        unread_count = notifications.filter(is_read=False).count()
        serializer = NotificationSerializer(notifications[:50], many=True)
        return Response({
            "notifications": serializer.data,
            "unread_count": unread_count
        })

class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success"})
