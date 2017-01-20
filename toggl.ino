int ledPin = D0;
int buttonPin = D5;
bool ready = true;
int last;

void setup() {
    pinMode(ledPin, OUTPUT);
    pinMode(buttonPin, INPUT);
    last = millis();
    digitalWrite(ledPin, LOW);
    
    Spark.function("ledTrigger", ledTrigger);
}

void loop() {
    if (millis() - last > 200) {
        if (digitalRead(buttonPin)) {
          if (ready) {
            ready = false;
            Spark.publish("buttonPressed");
            last = millis();
          }
        } else {
          ready = true; // button ready to be pressed again
        }
    }
}

int ledTrigger(String value) {
    if (value == "ON") {
	    digitalWrite(ledPin, HIGH);
    } else {
        digitalWrite(ledPin, LOW);
    }
	
	return 0;
}