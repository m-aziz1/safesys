// Arduino library
#include <Arduino.h>

// Function headers
void printArrayAsString(int arr[], int size);

#define muxS0 5                // Pin number for muxS0
#define muxS1 7                // Pin number for muxS1
#define locker 4                // Pin number for output from MUX (locker state)
const int numLockers = 4;       // Number of lockers
const int checkInterval = 1000; // Time interval for checking states

// State arrays to store current and previous locker states
int currentState[4] = {0, 0, 0, 0};

// Define the four binary states for muxS0 and muxS1
bool muxSelect[4][2] = {
    {LOW, LOW},  // State 0: 00
    {HIGH, LOW}, // State 1: 01
    {LOW, HIGH}, // State 2: 10
    {HIGH, HIGH} // State 3: 11
};

void setup()
{
  // Set output and input pins
  pinMode(muxS0, OUTPUT);
  pinMode(muxS1, OUTPUT);
  pinMode(locker, INPUT);

  // Set bits/second transmission rate for text output
  Serial.begin(9600);
}

void loop()
{
  // Iterate through each state of muxS0 and muxS1
  for (int i = 0; i < numLockers; i++)
  {
    // Set muxS0 and muxS1 to the current binary state
    digitalWrite(muxS0, muxSelect[i][0]);
    digitalWrite(muxS1, muxSelect[i][1]);

    // Get state (1 = closed, 0 = open) of lockers 1-4
    currentState[i] = digitalRead(locker);
  }

  // Print current state
  printArrayAsString(currentState, 4);

  // Time interval for checking states
  delay(checkInterval);
}

// Print arrays function
void printArrayAsString(int arr[], int size)
{
  Serial.print("[");
  for (int i = 0; i < size; i++)
  {
    Serial.print(arr[i]);
    if (i < size - 1)
    {
      Serial.print(", ");
    }
  }
  Serial.println("]");
}