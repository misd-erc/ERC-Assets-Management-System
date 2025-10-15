using Org.BouncyCastle.Security;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PortalCommon.Utilities
{
        /// <summary>
        /// A bidirectional (two-way) dictionary that allows you to look up a value by key
        /// or a key by value. Useful for mapping constants, enums, or entity IDs ↔ names.
        /// </summary>
        /// <typeparam name="TKey">The primary key type (e.g., ID or enum)</typeparam>
        /// <typeparam name="TValue">The secondary value type (e.g., string name)</typeparam>
        public class TwoWayDictionaryHelper<TKey, TValue> : IEnumerable<KeyValuePair<TKey, TValue>>
        {
            private readonly Dictionary<TKey, TValue> _forward = new();
            private readonly Dictionary<TValue, TKey> _reverse = new();

            /// <summary>
            /// Initializes a new two-way dictionary with the given key/value pairs.
            /// </summary>
            public TwoWayDictionaryHelper(IEnumerable<(TKey Key, TValue Value)> entries)
            {
                if (typeof(TKey) == typeof(TValue))
                    throw new InvalidParameterException($"{nameof(TKey)} and {nameof(TValue)} cannot be the same type.");

                AddRange(entries);
            }

            /// <summary>Gets the value associated with the specified key.</summary>
            public TValue this[TKey key] => _forward[key];

            /// <summary>Gets the key associated with the specified value.</summary>
            public TKey this[TValue value] => _reverse[value];

            /// <summary>Adds a key/value pair to both directions.</summary>
            public void Add(TKey key, TValue value)
            {
                _forward[key] = value;
                _reverse[value] = key;
            }

            /// <summary>Adds multiple key/value pairs.</summary>
            public void AddRange(IEnumerable<(TKey, TValue)> entries)
            {
                foreach (var (key, value) in entries)
                    Add(key, value);
            }

            /// <summary>Checks if a key exists in the dictionary.</summary>
            public bool Contains(TKey key) => _forward.ContainsKey(key);

            /// <summary>Checks if a value exists in the dictionary.</summary>
            public bool Contains(TValue value) => _reverse.ContainsKey(value);

            /// <summary>Attempts to get a value by key.</summary>
            public bool TryGetValue(TKey key, out TValue value) => _forward.TryGetValue(key, out value);

            /// <summary>Attempts to get a key by value.</summary>
            public bool TryGetValue(TValue value, out TKey key) => _reverse.TryGetValue(value, out key);

            public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator() => _forward.GetEnumerator();
            IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
        }
}
