"""
MongoDB data loader for RAG system.
Fetches car data directly from MongoDB Atlas and prepares it for embedding.
"""

import logging
import os
import json
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from pymongo import MongoClient

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "autoassist")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "cars_new")

# Output directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "backend" / "data" / "processed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def get_mongodb_client() -> MongoClient:
    """
    Initialize and return MongoDB client.
    
    Returns:
        MongoClient instance
        
    Raises:
        ValueError: If MONGODB_URI is not set
    """
    if not MONGODB_URI:
        raise ValueError(
            "MONGODB_URI environment variable is required. "
            "Set it in your .env file or environment variables."
        )
    
    logger.info(f"Connecting to MongoDB...")
    return MongoClient(MONGODB_URI)


def transform_car_document(car: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform MongoDB car document to RAG-friendly format.
    
    Args:
        car: Raw MongoDB document
        
    Returns:
        Transformed car record with normalized fields
    """
    # Extract and normalize fields (MongoDB uses spaces in field names)
    record = {
        # Identification
        "id": str(car.get("_id", "")),
        "make": car.get("Identification Brand") or car.get("brand", "Unknown"),
        "model": car.get("Identification Model") or car.get("model", "Unknown"),
        "variant": car.get("Identification Variant") or car.get("variant", ""),
        "year": car.get("Identification Year") or car.get("year", 2024),
        "body_type": car.get("Identification Body Type") or car.get("bodyType", "Unknown"),
        "segment": car.get("Identification Segment") or car.get("segment", "Unknown"),
        
        # Pricing (Ex-showroom price in lakhs)
        "price": float(car.get("Pricing Delhi Ex Showroom Price", 0)) / 100000 * 10000,  # Convert to lakhs equivalent
        "price_lakhs": float(car.get("Pricing Delhi Ex Showroom Price", 0)) / 100000,  # Convert rupees to lakhs
        
        # Engine
        "displacement": car.get("Engine Cc") or car.get("displacement", 0),
        "cylinders": car.get("Engine Cylinders") or car.get("cylinders", 0),
        "turbo": "Turbo" if car.get("Engine Turbo") == True else "NA",
        "power_bhp": car.get("Engine Bhp") or car.get("powerBhp", 0),
        "torque_nm": car.get("Engine Torque") or car.get("torqueNm", 0),
        
        # Transmission
        "transmission_type": car.get("Engine Transmission") or car.get("transmissionType", "Manual"),
        "num_gears": car.get("Engine Gears") or 5,
        "drive_type": car.get("Engine Drive") or car.get("driveType", "FWD"),
        
        # Fuel & Emissions  
        "mileage": car.get("Efficiency Mileage Arai") or car.get("Efficiency Mileage City") or car.get("Efficiency Mileage Highway") or car.get("mileageARAI", 0),
        "mileage_city": car.get("Efficiency Mileage City") or 0,
        "mileage_highway": car.get("Efficiency Mileage Highway") or 0,
        "fuel_type": determine_fuel_type(car),
        "emission_standard": car.get("Efficiency Emission Standard") or car.get("emissionStandard", "BS6"),
        
        # Performance
        "acceleration_0_to_100": car.get("Engine 0 100 Sec") or car.get("acceleration0to100", 0),
        "top_speed": car.get("Engine Top Speed") or car.get("topSpeed", 0),
        
        # Safety
        "airbags": car.get("Safety Airbags") or car.get("airbags", 0),
        "abs": car.get("Safety Abs") == True or car.get("abs", False),
        "esc": car.get("Safety Esp") == True or car.get("esc", False),
        "crash_rating": car.get("Safety Ncap Stars") or 0,
        "hill_hold": car.get("Safety Hill Hold") == True or False,
        "isofix": car.get("Safety Isofix") == True or False,
        "tpms": car.get("Safety Tpms") == True or False,
        
        # Comfort & Features
        "air_conditioning": True,  # Assume all modern cars have AC
        "sunroof": car.get("Features Sunroof") == True or car.get("sunroof", False),
        "cruise_control": car.get("Features Cruise Control") == True or car.get("cruiseControl", False),
        "ventilated_seats": car.get("Features Ventilated Seats") == True or car.get("ventilatedSeats", False),
        "keyless_entry": car.get("Features Keyless Entry") == True or car.get("keylessEntry", False),
        "wireless_charging": car.get("Features Wireless Charging") == True or False,
        "led_lights": car.get("Features Led Lights") == True or False,
        "alloy_wheels": car.get("Features Alloy Wheels") == True or False,
        
        # Infotainment
        "touchscreen_size": car.get("Features Touchscreen Inch") or car.get("touchscreenSize", 0),
        "connected_tech": car.get("Features Connected Tech") == True or car.get("connectedTech", False),
        "camera_360": car.get("Features 360 Camera") == True or False,
        
        # Dimensions
        "length": car.get("Dimensions Length") or car.get("length", 0),
        "width": car.get("Dimensions Width") or car.get("width", 0),
        "height": car.get("Dimensions Height") or car.get("height", 0),
        "wheelbase": car.get("Dimensions Wheelbase") or car.get("wheelbase", 0),
        "ground_clearance": car.get("Dimensions Ground Clearance") or car.get("groundClearance", 0),
        "boot_space": car.get("Dimensions Boot Liters") or car.get("bootSpace", 0),
        "fuel_tank": car.get("Efficiency Tank Capacity") or car.get("fuelTank", 0),
        "weight": car.get("Dimensions Weight Kg") or 0,
        "turning_radius": car.get("Dimensions Turning Radius") or 0,
        
        # ADAS
        "adas_level_2": car.get("Safety Adas Level 2") == True or False,
        
        # Practicality
        "seating_capacity": car.get("Identification Seating Capacity") or 5,
        
        # Ownership & Warranty
        "warranty_years": car.get("Warranty Years") or 3,
        "warranty_km": car.get("Warranty Km") or 0,
        "service_interval_km": car.get("Warranty Service Km") or 10000,
        
        # EV specific data
        "is_ev": car.get("Ev Data Is Ev") == True or False,
        "battery_kwh": car.get("Ev Data Battery Kwh") or 0,
        "ev_range_km": car.get("Ev Data Range Km") or 0,
        "charging_ac_hours": car.get("Ev Data Charging Ac Hours") or 0,
        "charging_dc_min": car.get("Ev Data Charging Dc Min") or 0,
        
        # Resale
        "resale_value": car.get("Pricing Delhi Resale Value") or "Good",
        "insurance_cost": car.get("Pricing Delhi Insurance Cost") or 0,
        "on_road_price": car.get("Pricing Delhi On Road Price", 0) / 100000,  # Convert to lakhs
    }
    
    # Create rich description for better semantic search
    record["description"] = create_description_from_record(record)
    
    return record


def determine_fuel_type(car: Dict[str, Any]) -> str:
    """
    Determine fuel type from various fields.
    
    Args:
        car: MongoDB car document
        
    Returns:
        Fuel type string (Electric, Hybrid, Diesel, Petrol, CNG)
    """
    # Check Engine Type field which contains fuel info
    engine_type = car.get("Engine Type", "")
    
    if "Electric" in str(engine_type):
        return "Electric"
    elif "Diesel" in str(engine_type):
        return "Diesel"
    elif "Petrol" in str(engine_type):
        return "Petrol"
    elif "CNG" in str(engine_type):
        return "CNG"
    elif "Hybrid" in str(engine_type):
        return "Hybrid"
    
    # Default to Petrol
    return "Petrol"


def create_description_from_record(record: Dict[str, Any]) -> str:
    """
    Create a rich, searchable text description from a car record for RAG embeddings.
    
    Args:
        record: Transformed car record
        
    Returns:
        Natural language description string
    """
    parts = []
    
    # Basic identification
    make = record.get("make", "Unknown")
    model = record.get("model", "Unknown")
    variant = record.get("variant", "")
    year = record.get("year", 2024)
    body_type = record.get("body_type", "Unknown")
    segment = record.get("segment", "Unknown")
    
    if variant:
        parts.append(f"{year} {make} {model} {variant}")
    else:
        parts.append(f"{year} {make} {model}")
    
    parts.append(f"{body_type} in the {segment} segment")
    
    # Pricing
    price_lakhs = record.get("price_lakhs", 0)
    if price_lakhs > 0:
        parts.append(f"Priced at ₹{price_lakhs:.2f} lakhs")
    
    # Engine & Performance
    fuel_type = record.get("fuel_type", "Petrol")
    displacement = record.get("displacement", 0)
    power_bhp = record.get("power_bhp", 0)
    torque_nm = record.get("torque_nm", 0)
    
    if power_bhp > 0 and torque_nm > 0 and displacement > 0:
        parts.append(f"{fuel_type} engine with {displacement}cc displacement producing {power_bhp}bhp and {torque_nm}Nm torque")
    elif power_bhp > 0:
        parts.append(f"{fuel_type} engine producing {power_bhp}bhp")
    else:
        parts.append(f"{fuel_type} fuel type")
    
    # Transmission
    transmission = record.get("transmission_type", "Manual")
    parts.append(f"{transmission} transmission")
    
    # Mileage - emphasize fuel efficiency for high mileage cars
    mileage = record.get("mileage", 0)
    if mileage > 0:
        if mileage >= 25:
            parts.append(f"Highly fuel efficient with excellent {mileage} kmpl mileage")
        elif mileage >= 20:
            parts.append(f"Very fuel efficient delivering {mileage} kmpl mileage")
        elif mileage >= 15:
            parts.append(f"Good fuel economy with {mileage} kmpl mileage")
        else:
            parts.append(f"Fuel efficiency of {mileage} kmpl")
    
    # Safety features
    safety_features = []
    airbags = record.get("airbags", 0)
    if airbags > 0:
        safety_features.append(f"{airbags} airbags")
    if record.get("abs"):
        safety_features.append("ABS")
    if record.get("esc"):
        safety_features.append("ESC")
    if record.get("parking_camera"):
        safety_features.append("parking camera")
    
    if safety_features:
        parts.append(f"Safety features include {', '.join(safety_features)}")
    
    # Comfort features
    comfort_features = []
    if record.get("sunroof"):
        comfort_features.append("sunroof")
    if record.get("cruise_control"):
        comfort_features.append("cruise control")
    if record.get("keyless_entry"):
        comfort_features.append("keyless entry")
    if record.get("ventilated_seats"):
        comfort_features.append("ventilated seats")
    
    if comfort_features:
        parts.append(f"Comfort features include {', '.join(comfort_features)}")
    
    # Infotainment
    infotainment_features = []
    touchscreen = record.get("touchscreen_size", 0)
    if touchscreen > 0:
        infotainment_features.append(f"{touchscreen}-inch touchscreen")
    if record.get("apple_carplay"):
        infotainment_features.append("Apple CarPlay/Android Auto")
    if record.get("connected_tech"):
        infotainment_features.append("connected car technology")
    
    if infotainment_features:
        parts.append(f"Infotainment system with {', '.join(infotainment_features)}")
    
    # ADAS
    adas_features = []
    if record.get("adaptive_cruise"):
        adas_features.append("adaptive cruise control")
    if record.get("lane_keep_assist"):
        adas_features.append("lane keep assist")
    if record.get("collision_warning"):
        adas_features.append("collision warning")
    if record.get("blind_spot"):
        adas_features.append("blind spot monitoring")
    
    if adas_features:
        parts.append(f"Advanced driver assistance (ADAS) with {', '.join(adas_features)}")
    
    # Practicality
    seating = record.get("seating_capacity", 5)
    if seating:
        parts.append(f"{seating}-seater")
    
    ground_clearance = record.get("ground_clearance", 0)
    if ground_clearance > 0:
        parts.append(f"{ground_clearance}mm ground clearance")
    
    boot_space = record.get("boot_space", 0)
    if boot_space > 0:
        parts.append(f"{boot_space}L boot space")
    
    return ". ".join(parts) + "."


def extract_number(value: Any, default: int = 0) -> int:
    """Extract numeric value from string or return default."""
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        import re
        match = re.search(r'\d+', value)
        if match:
            return int(match.group())
    return default


def load_cars_from_mongodb(limit: int = None) -> List[Dict[str, Any]]:
    """
    Load cars from MongoDB and transform for RAG.
    
    Args:
        limit: Maximum number of cars to load (None for all)
        
    Returns:
        List of transformed car records
    """
    client = get_mongodb_client()
    
    try:
        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]
        
        logger.info(f"Fetching cars from MongoDB collection: {MONGODB_COLLECTION}")
        
        # Query all cars (or limit if specified)
        query = {}
        cursor = collection.find(query)
        
        if limit:
            cursor = cursor.limit(limit)
        
        cars = list(cursor)
        logger.info(f"Fetched {len(cars)} cars from MongoDB")
        
        # Transform documents
        transformed_cars = []
        for car in cars:
            try:
                transformed = transform_car_document(car)
                # Add rich description for RAG embeddings
                transformed["description"] = create_description_from_record(transformed)
                transformed_cars.append(transformed)
            except Exception as e:
                logger.warning(f"Failed to transform car {car.get('_id')}: {e}")
                continue
        
        logger.info(f"Successfully transformed {len(transformed_cars)} cars")
        return transformed_cars
        
    except Exception as e:
        logger.error(f"Error loading cars from MongoDB: {e}")
        raise
    finally:
        client.close()


def save_processed_data(records: List[Dict[str, Any]], filename: str = "cars_processed.json"):
    """Save processed records to JSON file."""
    output_path = OUTPUT_DIR / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(records)} records to {output_path}")


def preview_records(records: List[Dict[str, Any]], num: int = 3):
    """Print preview of records."""
    print(f"\n=== Preview of {min(num, len(records))} records ===")
    for i, record in enumerate(records[:num], 1):
        print(f"\nRecord {i}:")
        print(f"  Make: {record['make']}")
        print(f"  Model: {record['model']}")
        print(f"  Year: {record['year']}")
        print(f"  Price: ₹{record['price_lakhs']} lakhs")
        print(f"  Body Type: {record['body_type']}")
        print(f"  Fuel: {record['fuel_type']}")
        print(f"  Mileage: {record['mileage']} kmpl")
        print(f"  Description: {record['description'][:200]}...")


def main():
    """Main function to load and process data from MongoDB."""
    try:
        # Load cars from MongoDB
        cars_data = load_cars_from_mongodb()
        
        if not cars_data:
            logger.error("No cars loaded from MongoDB. Please check your database connection.")
            return
        
        # Save processed data
        save_processed_data(cars_data, "cars_processed.json")
        
        # Preview
        preview_records(cars_data)
        
        logger.info("✅ MongoDB data loading complete!")
        logger.info(f"✅ Total cars processed: {len(cars_data)}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load data from MongoDB: {e}")
        raise


if __name__ == "__main__":
    main()

