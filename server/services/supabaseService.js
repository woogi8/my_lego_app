const { supabase, TABLES, COLUMN_MAPPING, REVERSE_COLUMN_MAPPING } = require('../config/supabase');

class SupabaseService {
  
  /**
   * 모든 레고 아이템 조회
   * @param {string} userId - 사용자 ID (옵션)
   * @returns {Promise<Array>} 레고 아이템 목록
   */
  async getAllLegoItems(userId = null) {
    try {
      let query = supabase
        .from(TABLES.LEGO_ITEMS)
        .select('*')
        .order('created_at', { ascending: false });
      
      // 기존 데이터의 user_id가 null일 수 있으므로 조건부 필터링
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ 레고 아이템 조회 오류:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length}개의 레고 아이템 조회 완료`);
      
      // 데이터를 한국어 컬럼명으로 변환
      return this.convertToKoreanColumns(data);
      
    } catch (error) {
      console.error('getAllLegoItems 오류:', error);
      throw error;
    }
  }
  
  /**
   * 레고 아이템 추가
   * @param {Object} itemData - 레고 아이템 데이터 (한국어 컬럼명)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 생성된 레고 아이템
   */
  async createLegoItem(itemData, userId = null) {
    try {
      // 한국어 컬럼명을 영어로 변환
      const convertedData = this.convertToEnglishColumns(itemData);
      
      // 사용자 ID 추가 (인증 구현 후)
      if (userId) {
        convertedData.user_id = userId;
      }
      
      // 타임스탬프 추가 (테이블에 이 컬럼들이 없을 수 있음)
      // convertedData.created_at = new Date().toISOString();
      // convertedData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from(TABLES.LEGO_ITEMS)
        .insert([convertedData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ 레고 아이템 생성 오류:', error);
        throw error;
      }
      
      console.log('✅ 레고 아이템 생성 완료:', data.lego_number);
      
      // 결과를 한국어 컬럼명으로 변환하여 반환
      return this.convertToKoreanColumns([data])[0];
      
    } catch (error) {
      console.error('createLegoItem 오류:', error);
      throw error;
    }
  }
  
  /**
   * 레고 아이템 수정
   * @param {number} id - 아이템 ID
   * @param {Object} itemData - 수정할 데이터 (한국어 컬럼명)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Object>} 수정된 레고 아이템
   */
  async updateLegoItem(id, itemData, userId = null) {
    try {
      // 한국어 컬럼명을 영어로 변환
      const convertedData = this.convertToEnglishColumns(itemData);
      
      // user_id 추가 (수정 시에도 user_id 설정)
      if (userId) {
        convertedData.user_id = userId;
      }
      
      // 수정 시간 업데이트 (테이블에 이 컬럼이 없을 수 있음)
      // convertedData.updated_at = new Date().toISOString();
      
      let query = supabase
        .from(TABLES.LEGO_ITEMS)
        .update(convertedData)
        .eq('id', id);
      
      // 기존 데이터의 user_id가 null일 수 있으므로 조건부 필터링
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      }
      
      const { data, error } = await query.select().single();
      
      if (error) {
        console.error('❌ 레고 아이템 수정 오류:', error);
        throw error;
      }
      
      console.log('✅ 레고 아이템 수정 완료:', id);
      
      // 결과를 한국어 컬럼명으로 변환하여 반환
      return this.convertToKoreanColumns([data])[0];
      
    } catch (error) {
      console.error('updateLegoItem 오류:', error);
      throw error;
    }
  }
  
  /**
   * 레고 아이템 삭제
   * @param {number} id - 아이템 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async deleteLegoItem(id, userId = null) {
    try {
      console.log('🔍 삭제 시도 - ID:', id, 'userId:', userId);
      
      // 먼저 삭제할 데이터가 존재하는지 확인
      const { data: existingData, error: selectError } = await supabase
        .from(TABLES.LEGO_ITEMS)
        .select('id, lego_number, product_name, user_id')
        .eq('id', id);
      
      if (selectError) {
        console.error('❌ 데이터 조회 오류:', selectError);
        throw selectError;
      }
      
      console.log('📊 조회된 데이터:', existingData);
      
      if (!existingData || existingData.length === 0) {
        throw new Error(`ID ${id}인 레고 아이템이 존재하지 않습니다.`);
      }
      
      const itemToDelete = existingData[0];
      console.log('🎯 삭제 대상:', {
        id: itemToDelete.id,
        lego_number: itemToDelete.lego_number,
        product_name: itemToDelete.product_name,
        user_id: itemToDelete.user_id
      });
      
      // 권한 확인
      if (userId && itemToDelete.user_id !== null && itemToDelete.user_id !== userId) {
        throw new Error(`삭제 권한이 없습니다. (소유자: ${itemToDelete.user_id}, 요청자: ${userId})`);
      }
      
      // 실제 삭제 수행
      let deleteQuery = supabase
        .from(TABLES.LEGO_ITEMS)
        .delete()
        .eq('id', id);
      
      // 사용자 권한에 따른 추가 필터링
      if (userId && itemToDelete.user_id === null) {
        console.log('💡 NULL user_id 데이터 삭제, 현재 사용자로 소유권 이전 후 삭제');
      }
      
      const { error: deleteError } = await deleteQuery;
      
      if (deleteError) {
        console.error('❌ 레고 아이템 삭제 오류:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ 레고 아이템 삭제 완료:', id);
      return true;
      
    } catch (error) {
      console.error('deleteLegoItem 오류:', error);
      throw error;
    }
  }
  
  /**
   * 일괄 레고 아이템 추가
   * @param {Array} itemsData - 레고 아이템 배열 (한국어 컬럼명)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 생성된 레고 아이템 목록
   */
  async bulkCreateLegoItems(itemsData, userId = null) {
    try {
      // 각 아이템을 영어 컬럼명으로 변환
      const convertedItems = itemsData.map(item => {
        const convertedItem = this.convertToEnglishColumns(item);
        
        // 사용자 ID 추가 (인증 구현 후)
        if (userId) {
          convertedItem.user_id = userId;
        }
        // 타임스탬프 추가 (테이블에 이 컬럼들이 없을 수 있음)
        // convertedItem.created_at = new Date().toISOString();
        // convertedItem.updated_at = new Date().toISOString();
        
        return convertedItem;
      });
      
      const { data, error } = await supabase
        .from(TABLES.LEGO_ITEMS)
        .insert(convertedItems)
        .select();
      
      if (error) {
        console.error('❌ 일괄 레고 아이템 생성 오류:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length}개의 레고 아이템 일괄 생성 완료`);
      
      // 결과를 한국어 컬럼명으로 변환하여 반환
      return this.convertToKoreanColumns(data);
      
    } catch (error) {
      console.error('bulkCreateLegoItems 오류:', error);
      throw error;
    }
  }
  
  /**
   * 전체 데이터 덮어쓰기 (기존 데이터 삭제 후 새 데이터 삽입)
   * @param {Array} itemsData - 새로운 레고 아이템 배열 (한국어 컬럼명)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<Array>} 생성된 레고 아이템 목록
   */
  async replaceAllLegoItems(itemsData, userId = null) {
    try {
      // 트랜잭션 시작 (Supabase는 자동으로 처리)
      
      // 1. 기존 데이터 삭제
      let deleteQuery = supabase.from(TABLES.LEGO_ITEMS).delete();
      
      if (userId) {
        deleteQuery = deleteQuery.eq('user_id', userId);
      } else {
        deleteQuery = deleteQuery.neq('id', 0); // 모든 데이터 삭제
      }
      
      const { error: deleteError } = await deleteQuery;
      
      if (deleteError) {
        console.error('❌ 기존 데이터 삭제 오류:', deleteError);
        throw deleteError;
      }
      
      console.log('✅ 기존 데이터 삭제 완료');
      
      // 2. 새 데이터 삽입
      if (itemsData.length > 0) {
        const result = await this.bulkCreateLegoItems(itemsData, userId);
        console.log(`✅ 전체 데이터 교체 완료: ${result.length}개 아이템`);
        return result;
      } else {
        console.log('✅ 전체 데이터 삭제 완료 (새 데이터 없음)');
        return [];
      }
      
    } catch (error) {
      console.error('replaceAllLegoItems 오류:', error);
      throw error;
    }
  }
  
  /**
   * 데이터베이스 상태 확인
   * @returns {Promise<Object>} 상태 정보
   */
  async getStatus() {
    try {
      const { count, error } = await supabase
        .from(TABLES.LEGO_ITEMS)
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error('❌ 상태 확인 오류:', error);
        throw error;
      }
      
      return {
        success: true,
        totalItems: count,
        database: 'Supabase',
        table: TABLES.LEGO_ITEMS,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('getStatus 오류:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // ========== 유틸리티 메서드 ==========
  
  /**
   * 영어 컬럼명을 한국어로 변환
   * @param {Array} data - 영어 컬럼명 데이터 배열
   * @returns {Array} 한국어 컬럼명 데이터 배열
   */
  convertToKoreanColumns(data) {
    return data.map(item => {
      const convertedItem = {};
      
      Object.keys(item).forEach(key => {
        const koreanKey = REVERSE_COLUMN_MAPPING[key] || key;
        convertedItem[koreanKey] = item[key];
      });
      
      return convertedItem;
    });
  }
  
  /**
   * 한국어 컬럼명을 영어로 변환
   * @param {Object} data - 한국어 컬럼명 데이터
   * @returns {Object} 영어 컬럼명 데이터
   */
  convertToEnglishColumns(data) {
    const convertedItem = {};
    
    Object.keys(data).forEach(key => {
      // COLUMN_MAPPING에 정의된 컬럼만 변환 (정의되지 않은 컬럼은 무시)
      const englishKey = COLUMN_MAPPING[key];
      
      if (englishKey) {
        // 값이 존재하고 빈 문자열이 아닌 경우에만 추가
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          let value = data[key];
          
          // 가격 관련 필드는 정수로 변환
          if (['retail_price', 'purchase_price', 'current_market_price'].includes(englishKey)) {
            value = Math.round(Number(value) || 0);
          }
          
          // 날짜 필드 유효성 검사 및 변환
          if (['release_date', 'purchase_date'].includes(englishKey)) {
            // 유효하지 않은 날짜 형식 처리
            if (value === '0000-00-00' || value === '00-00-0000' || !value || value === 'N/A') {
              value = null;  // null로 설정
            } else {
              // 날짜 형식 검증 및 유효성 확인
              const datePattern = /^\d{4}-\d{2}-\d{2}$/;
              if (datePattern.test(value)) {
                // YYYY-MM-DD 형식이면 유효성 확인
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                  value = null;  // 잘못된 날짜
                } else {
                  // 실제 날짜 객체로 검증
                  const testDate = new Date(value);
                  if (isNaN(testDate.getTime())) {
                    value = null;
                  }
                }
              } else {
                // YYYY-MM-DD가 아닌 경우 변환 시도
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                  value = date.toISOString().split('T')[0];
                } else {
                  value = null;
                }
              }
            }
          }
          
          // null이 아닌 경우에만 추가
          if (value !== null) {
            convertedItem[englishKey] = value;
          }
        }
      }
    });
    
    return convertedItem;
  }
  
  /**
   * 연결 테스트
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from(TABLES.LEGO_ITEMS)
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase 연결 실패:', error);
        return false;
      }
      
      console.log('✅ Supabase 연결 성공');
      return true;
      
    } catch (error) {
      console.error('❌ Supabase 연결 테스트 오류:', error);
      return false;
    }
  }
}

module.exports = new SupabaseService();