import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { openDB } from '../database/db';

export default function DatabaseDebugScreen() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const db = await openDB();
      // sqlite_master table holds schema info
      const result = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' AND name != 'android_metadata'"
      );
      setTables(result.map(r => r.name));
    } catch (e) {
      console.error("Failed to fetch tables", e);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete ALL data from ALL tables? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await openDB();
              // Get all table names first
              const tableResult = await db.getAllAsync(
                "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' AND name != 'android_metadata'"
              );
              
              const tableNames = tableResult.map(r => r.name);
              
              // Clear each table
              for (const table of tableNames) {
                await db.runAsync(`DELETE FROM ${table}`);
              }
              
              Alert.alert("Success", "All data cleared successfully");
              
              // Refresh current view if needed
              if (selectedTable) {
                fetchTableData(selectedTable);
              }
            } catch (e) {
              console.error("Failed to clear data", e);
              Alert.alert("Error", "Failed to clear data: " + e.message);
            }
          }
        }
      ]
    );
  };

  const fetchTableData = async (tableName) => {
    try {
      setSelectedTable(tableName);
      const db = await openDB();
      // NOTE: Table names cannot be parameterized in standard prepared statements usually.
      // Since we get tableName from the system table list, it's safe-ish.
      const result = await db.getAllAsync(`SELECT * FROM ${tableName}`);
      setTableData(result);
    } catch (e) {
      console.error(`Failed to fetch data for ${tableName}`, e);
    }
  };

  const renderTableItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.tableItem, selectedTable === item && styles.selectedTableItem]}
      onPress={() => fetchTableData(item)}
    >
      <Text style={[styles.tableText, selectedTable === item && styles.selectedTableText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderDataItem = ({ item }) => (
    <View style={styles.dataItem}>
      <Text style={styles.dataText}>{JSON.stringify(item, null, 2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Database Debug</Text>
      
      <TouchableOpacity 
        style={styles.clearButton} 
        onPress={clearAllData}
      >
        <Text style={styles.clearButtonText}>🗑 DELETE ALL DATA</Text>
      </TouchableOpacity>

      <View style={styles.tableListContainer}>
        <Text style={styles.subHeader}>Tables:</Text>
        <FlatList
          data={tables}
          renderItem={renderTableItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tableListContent}
        />
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.subHeader}>
          {selectedTable ? `Data: ${selectedTable} (${tableData.length} rows)` : 'Select a table'}
        </Text>
        <FlatList
          data={tableData}
          renderItem={renderDataItem}
          keyExtractor={(item, index) => index.toString()}
          style={styles.dataList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 30, // For status bar if SafeAreaView doesn't catch it on some devices
    textAlign: 'center',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#ff3b30',
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: '#444',
  },
  tableListContainer: {
    height: 60,
    marginBottom: 10,
  },
  tableListContent: {
    paddingRight: 10,
    alignItems: 'center',
  },
  tableItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedTableItem: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  tableText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedTableText: {
    color: '#fff',
  },
  dataContainer: {
    flex: 1,
  },
  dataList: {
    flex: 1,
  },
  dataItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

