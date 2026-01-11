#!/bin/bash
# Script to spawn all monster types for testing

API_URL="http://localhost:5138"

# All monster types
MONSTERS=(
  # Original
  "Bug" "AIHallucination" "Manager" "Boss" "UnexplainedBug"
  # JavaScript
  "JsUndefined" "JsNaN" "JsCallbackHell"
  # Python
  "PyIndentationError" "PyNoneType" "PyImportError"
  # Java
  "JavaNullPointer" "JavaClassNotFound" "JavaOutOfMemory"
  # C#
  "CsNullReference" "CsStackOverflow" "CsInvalidCast"
  # C/C++
  "CSegFault" "CStackOverflow" "CMemoryLeak"
  # TypeScript
  "TsTypeError" "TsAny" "TsReadonly"
  # PHP
  "PhpPaamayim" "PhpFatalError" "PhpUndefinedIndex"
  # Go
  "GoNilPanic" "GoDeadlock" "GoImportCycle"
  # Rust
  "RustBorrowChecker" "RustPanic" "RustLifetimeError"
  # Ruby
  "RubyNoMethodError" "RubyLoadError" "RubySyntaxError"
  # Swift
  "SwiftFoundNil" "SwiftForceUnwrap" "SwiftIndexOutOfRange"
  # Kotlin
  "KotlinNullPointer" "KotlinClassCast" "KotlinUninitialized"
  # Scala
  "ScalaMatchError" "ScalaAbstractMethod" "ScalaStackOverflow"
  # R
  "REvalError" "RObjectNotFound" "RSubscriptOutOfBounds"
  # SQL
  "SqlDeadlock" "SqlSyntaxError" "SqlTimeout"
  # Bash
  "BashCommandNotFound" "BashPermissionDenied" "BashCoreDumped"
  # Perl
  "PerlUninitialized" "PerlSyntaxError" "PerlCantLocate"
  # Lua
  "LuaIndexNil" "LuaBadArgument" "LuaStackOverflow"
  # Dart
  "DartNullCheck" "DartRangeError" "DartNoSuchMethod"
  # Elixir
  "ElixirFunctionClause" "ElixirArgumentError" "ElixirKeyError"
)

echo "Spawning ${#MONSTERS[@]} monsters..."

X=500
Y=500
COL=0

for monster in "${MONSTERS[@]}"; do
  curl -s -X POST "$API_URL/debug/spawn-monster?type=$monster&x=$X&y=$Y" > /dev/null
  echo "Spawned: $monster at ($X, $Y)"
  
  X=$((X + 150))
  COL=$((COL + 1))
  
  if [ $COL -ge 10 ]; then
    COL=0
    X=500
    Y=$((Y + 150))
  fi
done

echo "Done! All monsters spawned in a grid."
