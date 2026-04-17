from src.main import greet

def test_greet():
    assert greet("Kimi") == "Hello, Kimi!"
    assert greet() == "Hello, World!"
