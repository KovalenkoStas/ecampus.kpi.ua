(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name ecampusApp.controller:AttestationCtrl
   * @description
   * # AttestationCtrl
   * Controller of the ecampusApp
   */
  angular
    .module('ecampusApp')
    .controller('AttestationCtrl', AttestationCtrl);

  AttestationCtrl.$inject = ['api'];
  function AttestationCtrl(api) {
    /* jshint validthis: true */
    var attest = this;

    attest.errorMessageGroups = '';

    init();

    function init() {
      // init attestation params
      attest.errorMessageYears = '';
      attest.errorMessageAttests = '';
      attest.attestationPeriodId = null;
      // init students results
      attest.getStudentsResult = false;
      attest.studentsResult = [];
      // init groups result
      attest.getGroupsResults = false;
      attest.disciplinesListForGroups = [];
      attest.groupsResult = [];
      // init lecturers result
      attest.getLecturersResults = false;
      attest.groupsListForLecturers = [];
      attest.coursesListForLecturers = [];
      attest.disciplinesListForLecturers = [];

      loadStudyYears();
      loadSemesters();
      loadAttestationPeriods();
    }

    attest.errorLoadGroupsResult = '';
    attest.errorMessageLecturers = '';
    attest.errorMessageStudents = '';

    attest.setPill = function(newPill) {
      attest.pill = newPill;
    };

    attest.isSet = function(pillNum) {
      return attest.pill === pillNum;
    };

    function setCurrentStudyYear(response) {
      for (var i = 0; i < response.length; i++) {
        var current = response[i];
        if (current.isActual) {
          return current;
        }
      }
    }

    function loadStudyYears() {
      var url = 'Attestation/studyYear';
      var method = 'GET';

      api.execute(method, url)
        .then(function(response) {
          attest.studyYears = response;
          attest.studyYears.selected = setCurrentStudyYear(response);
        },
        function() {
          attest.errorMessageYears = (
            'Не вдалося завантажити список навчальних років'
          );
          attest.studyYears = null;
        });
    }

    function getCurrentStudySemester() {
      var currentStudySemester = 0;
      var currentDate = new Date();
      var month = currentDate.getMonth();
      if (month >= 8 && month <= 11) {
        currentStudySemester = 1;
      } else {
        currentStudySemester = 2;
      }
      return currentStudySemester;
    }

    function setCurrentStudySemester(response) {
      var currentStudySemester = getCurrentStudySemester();
      if (currentStudySemester !== 0) {
        for (var i = 0; i < response.length; i++) {
          var current = response[i];
          if (current.id === currentStudySemester) {
            return current;
          }
        }
      }
    }

    function loadSemesters() {
      attest.studySemesters = [
        { id: 1, name: 'Перший семестр' },
        { id: 2, name: 'Другий семестр' }
      ];
      attest.studySemesters.selected = setCurrentStudySemester(
        attest.studySemesters
      );
    }

    // 1 period - (7 - 9) study year week
    // 2 period - (13 - 15) study year week
    function getCurrentStudyAttestationPeriod() {
      Date.prototype.getWeek = function() {
        var date = new Date(this.getTime());
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // January 4 is always in week 1.
        var week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and
        // count number of weeks from date to week1.
        return (
          1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
            3 + (week1.getDay() + 6) % 7) / 7)
        );
      };

      var currentStudyAttestationPeriod = 'не визначено';
      var currentDate = new Date();
      var week = currentDate.getWeek();

      if ((week >= 42 && week <= 44) || (week >= 12 && week <= 14)) {
        currentStudyAttestationPeriod = 'Атестація №1';
      } else if ((week >= 48 && week <= 50) || (week >= 18 && week <= 20)) {
        currentStudyAttestationPeriod = 'Атестація №2';
      }
      return currentStudyAttestationPeriod;
    }

    function setCurrentStudyAttestationPeriod(response) {
      var currentStudyAttestationPeriod = getCurrentStudyAttestationPeriod();
      if (currentStudyAttestationPeriod !== 0) {
        for (var i = 0; i < response.length; i++) {
          var current = response[i];
          if (current.name === currentStudyAttestationPeriod) {
            return current;
          }
        }
      }
    }

    function loadAttestationPeriods() {
      var url = 'Attestation';
      var method = 'GET';

      api.execute(method, url)
        .then(function(response) {
          attest.studyAttestationPeriod = response;
          attest.studyAttestationPeriod.selected = (
            setCurrentStudyAttestationPeriod(response)
          );
        },
        function() {
          attest.errorMessageAttests = (
            'Не вдалося завантажити список атестацій'
          );
          attest.attestations = null;
        });
    }

    attest.getDisciplineName = getDisciplineName;

    function getDisciplineName(name) {
      var result = name.split(',');
      return result[0];
    }

    // sort response in this order:
    // 1 - by course 2 - by study group name
    // 3 - by discipline name
    function sortRuleForLecturersResult(a, b) {
      var course1 = +(a.course);
      var course2 = +(b.course);
      var group1 = a.studyGroup.name;
      var group2 = b.studyGroup.name;
      var disc1 = a.rnpRow.name;
      var disc2 = b.rnpRow.name;

      return (
        course1 - course2 || group1.localeCompare(group2) ||
        disc1.localeCompare(disc2)
      );
    }

    function generateUrlForAttestPeriod(year, semester, attestNum) {
      return (
        'Attestation/period?dcStudingYearId=' + year +
        '&semesterYear=' + semester + '&dcLoadId=' + attestNum
      );
    }

    attest.checkAttestationAvailability = function() {
      var yearId = attest.studyYears.selected.id;
      var semesterId = attest.studySemesters.selected.id;
      var periodId = attest.studyAttestationPeriod.selected.id;

      checkAttestationAvailability(yearId, semesterId, periodId);
    };

    function checkAttestationAvailability(
      dcStudingYearId,
      semesterYear,
      dcLoadId) {
      var url = generateUrlForAttestPeriod(
        dcStudingYearId,
        semesterYear,
        dcLoadId
      );
      var method = 'GET';
      attest.errorAttestationPeriod = (
        'Немає даних про атестацію для таких параметрів!'
      );

      api.execute(method, url)
        .then(function(response) {
          if (response) {
            attest.attestationPeriodId = +response;
            if (response.data !== undefined) {
              var msg = 'No attestation period with this params';
              if (response.data.message === msg) {
                attest.attestationPeriodId = -1;
              }
            }
          } else {
            attest.attestationPeriodId = -1;
          }
        },
        function() {
          attest.attestationPeriodId = -1;
        });
    }

    attest.loadGroups = function(namePattern, year) {
      if (namePattern.length > 1) {
        var url = 'Account/group/find/' + namePattern + '/year/' + year;
        // url + namePattern (2 first symbol of group)
        api.execute('GET', url)
          .then(function(response) {
            attest.errorMessageGroups = '';
            attest.Groups = response;
          },
          function() {
            attest.errorMessageGroups = 'Не вдалося завантажити список груп';
            attest.Groups = null;
          });
      } else {
        attest.errorMessageGroups = (
          'Введіть більше 2-х символів для пошуку групи'
        );
      }
    };

    attest.loadGroupsResult = function(rtStudyGroupId, cAttestationPeriodId) {
      var url = (
        'Attestation/group/' + rtStudyGroupId + '/period/' +
        cAttestationPeriodId + '/result'
      );
      api.execute('GET', url)
        .then(function(response) {
          attest.errorLoadGroupsResult = '';
          attest.getGroupsResults = true;
        },
        function() {
          attest.errorLoadGroupsResult = (
            'Не вдалося завантажити результати для даної групи'
          );
          attest.groupsResult = null;
        });
    };

    attest.loadLecturers = function(namePattern) {
      if (namePattern.length > 2) {
        var url = 'Account/employee/find/' + namePattern;
        // url + namePattern (3 first symbol of group)
        api.execute('GET', url)
          .then(function(response) {
            attest.errorMessageLecturers = '';
            attest.lecturersList = response;
          },
          function() {
            attest.errorMessageLecturers = 'Не вдалося завантажити список груп';
            attest.lecturersList = null;
          });
      } else {
        attest.errorMessageLecturers = (
          'Введіть більше 3-х символів для пошуку викладача'
        );
      }
    };

    attest.createStringForSelect = createStringForSelect;

    function createStringForSelect(obj) {
      var COURSE = 'курс';
      var GROUP = 'група';
      var SPACE = ' ';
      var DASH = ' - ';
      if (obj) {
        return (obj.course.toString() + SPACE +
          COURSE + DASH +
          SPACE + GROUP + SPACE +
          obj.studyGroup + DASH +
          obj.disciplineName
        );
      }
    }

    function sortRuleAttestationsLectRes(a, b) {
      var name1 = a.studentName;
      var name2 = b.studentName;

      return name1.localeCompare(name2);
    }

    function transformAttestationsForLecturerResults(array) {
      var result = [];
      var obj = {};

      array.forEach(function(item) {
        obj = {
          studentName: item.student.name,
          attestationName: item.attestation.name
        };
        result.push(obj);
      });

      return result.sort(sortRuleAttestationsLectRes);
    }

    function transformLecturersAttestations(array) {
      var result = [];
      var obj = {};

      array.forEach(function(item) {
        obj = {
          course: item.course,
          studyGroup: item.studyGroup.name,
          disciplineName: getDisciplineName(item.rnpRow.name),
          attestations: transformAttestationsForLecturerResults(
            item.attestations
          )
        };
        result.push(obj);
      });

      return result;
    }

    attest.loadLecturersResult = function(eEmployees1Id, cAttestationPeriodId) {
      var url = (
        'Attestation/lecturer/' + eEmployees1Id + '/period/' +
        cAttestationPeriodId + '/result'
      );
      api.execute('GET', url)
        .then(function(response) {
          console.log('loadLecturersResult');
          var sortedResponse = response.sort(sortRuleForLecturersResult);
          console.log(sortedResponse);
          attest.errorLecturersResult = '';
          attest.getLecturersResults = true;
          attest.lecturersResult = transformLecturersAttestations(
            sortedResponse
          );
          console.log(transformLecturersAttestations);
          console.log(attest.lecturersResult);
        },
        function() {
          attest.errorLecturersResult = (
            'Не вдалося завантажити результати для даного викладача'
          );
          attest.lecturersResult = null;
          attest.getLecturersResults = false;
        });
    };

    attest.loadStudents = function(namePattern) {
      if (namePattern.length > 2) {
        var url = 'Account/student/find/' + namePattern;
        // url + namePattern (3 first symbol of group)
        api.execute('GET', url)
          .then(function(response) {
            attest.errorMessageStudents = '';
            attest.students = response;
          },
          function() {
            attest.errorMessageStudents = 'Не вдалося завантажити список груп';
            attest.students = null;
          });
      } else {
        attest.errorMessageStudents = (
          'Введіть більше 3-х символів для пошуку студента'
        );
      }
    };

    function transformStudentsAttestations(array) {
      var result = [];
      var obj = {};

      array.forEach(function(item) {
        obj = {
          attestation: item.attestation.name,
          lecturer: item.lecturer.name,
          disciplineName: getDisciplineName(item.rnpRow.name)
        };
        result.push(obj);
      });

      return result;
    }

    attest.loadStudentsResult = function(sPersonalityId, cAttestationPeriodId) {
      var url = (
        'Attestation/student/' + sPersonalityId + '/period/' +
        cAttestationPeriodId + '/result'
      );
      var method = 'GET';
      api.execute(method, url)
        .then(function(response) {
          attest.getStudentsResult = true;
          attest.attestationResults = transformStudentsAttestations(
            response[0].attestations
          );
        },
        function() {
          attest.studentsResult = null;
        });
    };

    // sort data in table functions

    // init value TODO add to global cntrl init function
    attest.sortOrderStudent = {
      type: null,
      sortReverse: null
    };

    attest.sortOrderLecturer = {
      type: null,
      sortReverse: null
    };

    function changeSortOrder(orderBy) {
      orderBy.sortReverse = !orderBy.sortReverse;
    }

    function setSortOrderType(orderBy, newOrderType) {
      orderBy.type = newOrderType;
      changeSortOrder(orderBy);
    }

    function isAscendingSort(orderBy, orderType) {
      return orderBy.type === orderType && orderBy.sortReverse;
    }

    function isDescendingSort(orderBy, orderType) {
      return orderBy.type === orderType && !orderBy.sortReverse;
    }

    attest.setSortOrderType = setSortOrderType;
    attest.isAscendingSort = isAscendingSort;
    attest.isDescendingSort = isDescendingSort;
  }
})();
