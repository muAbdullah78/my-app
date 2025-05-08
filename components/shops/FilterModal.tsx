import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { X } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Slider from '@/components/ui/Slider';
import { useState } from 'react';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    services: string[];
    rating: number;
    priceRange: [number, number];
    distance: number;
  };
  onApply: (filters: FilterModalProps['filters']) => void;
}

const serviceOptions = [
  "Wash & Fold",
  "Dry Cleaning",
  "Ironing",
  "Express Service",
  "Pickup & Delivery",
  "Self-Service",
  "Alterations",
  "Shoe Care",
];

export default function FilterModal({ visible, onClose, filters, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState({ ...filters });
  
  const toggleService = (service: string) => {
    if (localFilters.services.includes(service)) {
      setLocalFilters({
        ...localFilters,
        services: localFilters.services.filter(s => s !== service),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        services: [...localFilters.services, service],
      });
    }
  };
  
  const setRating = (rating: number) => {
    setLocalFilters({
      ...localFilters,
      rating,
    });
  };
  
  const setDistance = (distance: number) => {
    setLocalFilters({
      ...localFilters,
      distance,
    });
  };
  
  const resetFilters = () => {
    setLocalFilters({
      services: [],
      rating: 0,
      priceRange: [0, 100],
      distance: 5,
    });
  };
  
  const handleApply = () => {
    onApply(localFilters);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Services</Text>
              <View style={styles.servicesGrid}>
                {serviceOptions.map(service => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceTag,
                      localFilters.services.includes(service) && styles.serviceTagActive,
                    ]}
                    onPress={() => toggleService(service)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.serviceTagText,
                        localFilters.services.includes(service) && styles.serviceTagTextActive,
                      ]}
                    >
                      {service}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Minimum Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      rating <= localFilters.rating && styles.ratingButtonActive,
                    ]}
                    onPress={() => setRating(rating)}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        rating <= localFilters.rating && styles.ratingButtonTextActive,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Distance (miles)</Text>
              <Slider
                value={localFilters.distance}
                onValueChange={setDistance}
                minimumValue={1}
                maximumValue={10}
                step={1}
              />
              <View style={styles.distanceLabels}>
                <Text style={styles.distanceLabel}>1 mi</Text>
                <Text style={styles.distanceValue}>{localFilters.distance} mi</Text>
                <Text style={styles.distanceLabel}>10 mi</Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              text="Reset Filters"
              variant="outline"
              onPress={resetFilters}
              style={styles.resetButton}
            />
            <Button
              text="Apply Filters"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  filtersScroll: {
    paddingHorizontal: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  serviceTag: {
    backgroundColor: colors.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceTagActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  serviceTagText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.text,
  },
  serviceTagTextActive: {
    color: colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  ratingButtonTextActive: {
    color: colors.white,
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  distanceLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  distanceValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 0,
  },
});