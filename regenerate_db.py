#!/usr/bin/env python3
"""Script to regenerate the practice database with more data"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sample_data import SampleDataGenerator

if __name__ == '__main__':
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'practice.db')
    
    # Remove existing database
    if os.path.exists(db_path):
        print(f"Removing existing database: {db_path}")
        os.remove(db_path)
    
    # Generate new database with more data
    print("Generating new database with expanded data...")
    generator = SampleDataGenerator()
    generator.initialize_database()
    print("Database regenerated successfully!")
    print(f"Location: {db_path}")


